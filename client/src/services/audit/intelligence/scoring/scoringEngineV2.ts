import type { FindingSeverity } from "@/types/auditEngine"
import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"
import { getPageImportanceWeight } from "@/services/audit/intelligence/pageImportance"
import type { AuditPage, AuditPageType } from "@/types/auditEngine"
import { INTELLIGENCE_CATEGORY_WEIGHTS } from "@/services/audit/intelligence/categories"
import {
  calculateAuditScoreV3,
  calculatePageScoreFromAuditFindingsV3,
  calculatePageScoreV3,
} from "@/services/audit/intelligence/scoring/scoringEngineV3"
import type { ScoringEngineV3Options, ScoringEngineV3Result } from "@/services/audit/intelligence/scoring/scoringEngineV3"
import { LEGACY_SEVERITY_PENALTY } from "@/services/audit/intelligence/scoring/scoringPolicy"

/**
 * Scoring Engine V2 — compatibility bridge to V3 Calibrated Hybrid model.
 *
 * V2 exports are preserved for existing consumers. All scoring math delegates
 * to scoringEngineV3.ts. Legacy flat severity penalties remain exported for
 * calculateAuditScore.ts (V1 bridge).
 */

/** @deprecated Use calculateAuditScoreV3 — retained for explicit V2-shaped calls */
export function calculateCategoryScoresV2(
  findings: IntelligenceFindingDraft[],
  pages: AuditPage[]
): Record<ScoreCategory, number> {
  return calculateAuditScoreV3(findings, pages).categories
}

/** @deprecated Use calculateAuditScoreV3 — computes weighted growth from category scores */
export function calculateGrowthScoreV2(
  categoryScores: Record<ScoreCategory, number>
): number {
  const weighted =
    categoryScores.conversion * 0.38 +
    categoryScores.trust * 0.28 +
    categoryScores.mobile * 0.18 +
    categoryScores.ux * 0.16

  return Math.round(Math.min(94, Math.max(38, weighted)))
}

export function calculatePageScore(
  page: AuditPage,
  findings: IntelligenceFindingDraft[],
  options?: { analyzed?: boolean }
): number {
  return calculatePageScoreV3(page, findings, options)
}

export function calculatePageScoreFromAuditFindings(
  page: AuditPage,
  findings: Array<{ pageId?: string; severity: FindingSeverity }>,
  options?: { analyzed?: boolean }
): number {
  return calculatePageScoreFromAuditFindingsV3(page, findings, options)
}

export function calculateAllPageScores(
  pages: AuditPage[],
  findings: IntelligenceFindingDraft[],
  analyzedPageIds?: Set<string>
): Record<string, number> {
  return calculateAuditScoreV3(findings, pages, { analyzedPageIds }).pageScores
}

export function calculateAuditScoreV2(
  findings: IntelligenceFindingDraft[],
  pages: AuditPage[],
  analyzedPageIds?: Set<string>,
  options?: Omit<ScoringEngineV3Options, "analyzedPageIds">
): ScoringEngineV3Result & {
  categories: Record<ScoreCategory, number>
  growthScore: number
  pageScores: Record<string, number>
} {
  return calculateAuditScoreV3(findings, pages, {
    ...options,
    analyzedPageIds,
  })
}

/** Legacy weighted penalty — preserved for tests and external references */
export function legacyWeightedPenalty(
  finding: IntelligenceFindingDraft,
  pages: AuditPage[]
): number {
  const basePenalty = LEGACY_SEVERITY_PENALTY[finding.severity] * finding.weight
  const categoryMultiplier = INTELLIGENCE_CATEGORY_WEIGHTS[finding.category] ?? 0.7
  const confidenceMultiplier = 0.75 + finding.confidence / 400

  if (finding.scope === "site" || !finding.pageId) {
    return basePenalty * categoryMultiplier * confidenceMultiplier
  }

  const page = pages.find((item) => item.id === finding.pageId)
  const pageWeight = page
    ? getPageImportanceWeight(page.pageType, page.path)
    : getPageImportanceWeight("custom" as AuditPageType, "/")

  return basePenalty * categoryMultiplier * confidenceMultiplier * pageWeight
}

/** Backward-compatible bridge for legacy ScoredFindingInput consumers */
export type ScoredFindingBridge = {
  ruleId: string
  scoreCategory: ScoreCategory
  severity: FindingSeverity
  category: IntelligenceFindingDraft["legacyCategory"]
  title: string
  description: string
  recommendation: string
  pageId?: string
}

export function intelligenceFindingToScoredInput(
  finding: IntelligenceFindingDraft
): ScoredFindingBridge {
  return {
    ruleId: finding.ruleId,
    scoreCategory: finding.scoreCategory,
    severity: finding.severity,
    category: finding.legacyCategory,
    title: finding.title,
    description: finding.description,
    recommendation: finding.recommendation,
    pageId: finding.pageId,
  }
}

export {
  calculateAuditScoreV3,
  calculatePageScoreV3,
  calculateCategoryScoresV3,
  calculateUncappedGrowthScoreV3,
} from "@/services/audit/intelligence/scoring/scoringEngineV3"

export type { ScoringEngineV3Result, ScoringEngineV3Options } from "@/services/audit/intelligence/scoring/scoringEngineV3"

export { resolveBlockerCeiling } from "@/services/audit/intelligence/scoring/blockerCeilingResolver"
export type { AppliedBlocker, BlockerCeilingResult } from "@/services/audit/intelligence/scoring/blockerCeilingResolver"
export { calculateAuditConfidence } from "@/services/audit/intelligence/scoring/auditConfidence"
export type { AuditConfidenceResult } from "@/services/audit/intelligence/scoring/auditConfidence"
export { calculateGrowthPotential } from "@/services/audit/intelligence/scoring/growthPotential"
export type { GrowthPotentialResult } from "@/services/audit/intelligence/scoring/growthPotential"
export {
  SCORING_ENGINE_VERSION,
  CATEGORY_SCORING_POLICY,
  GROWTH_SCORE_POLICY,
} from "@/services/audit/intelligence/scoring/scoringPolicy"
