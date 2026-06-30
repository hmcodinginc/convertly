import type { FindingSeverity } from "@/types/auditEngine"
import type { AuditPage } from "@/types/auditEngine"
import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import { INTELLIGENCE_CATEGORY_WEIGHTS } from "@/services/audit/intelligence/categories"
import { getPageImportanceWeight } from "@/services/audit/intelligence/pageImportance"
import type { AuditPageType } from "@/types/auditEngine"
import { getRuleMetadata } from "@/services/audit/intelligence/rules/ruleMetadata"
import { resolveRuleScoringProfile } from "@/services/audit/intelligence/rules/ruleScoringMetadata"
import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"
import { resolveBlockerCeiling, type AppliedBlocker } from "@/services/audit/intelligence/scoring/blockerCeilingResolver"
import {
  calculateAuditConfidence,
  type AuditConfidenceResult,
} from "@/services/audit/intelligence/scoring/auditConfidence"
import {
  calculateGrowthPotential,
  type GrowthPotentialResult,
} from "@/services/audit/intelligence/scoring/growthPotential"
import type { PageContentSnapshot } from "@/services/audit/pageContentService"
import {
  CATEGORY_SCORING_POLICY,
  GROWTH_SCORE_POLICY,
  SEVERITY_PENALTY_UNITS,
} from "@/services/audit/intelligence/scoring/scoringPolicy"

export type ScoringEngineV3Options = {
  analyzedPageIds?: Set<string>
  pageSnapshots?: PageContentSnapshot[]
  applicableRuleCount?: number
  executedRuleCount?: number
}

export type ScoringEngineV3Result = {
  categories: Record<ScoreCategory, number>
  growthScore: number
  uncappedGrowthScore: number
  scoreCeiling: number
  appliedBlockers: AppliedBlocker[]
  pageScores: Record<string, number>
  auditConfidence: AuditConfidenceResult
  growthPotential: GrowthPotentialResult
  engineVersion: typeof import("@/services/audit/intelligence/scoring/scoringPolicy").SCORING_ENGINE_VERSION
}

function clampCategoryScore(value: number, category: ScoreCategory): number {
  const policy = CATEGORY_SCORING_POLICY[category]
  return Math.round(Math.min(policy.ceiling, Math.max(policy.floor, value)))
}

function clampGrowthScore(value: number): number {
  return Math.round(
    Math.min(GROWTH_SCORE_POLICY.maxScore, Math.max(GROWTH_SCORE_POLICY.minScore, value))
  )
}

function clampPageScore(value: number): number {
  return Math.round(
    Math.min(GROWTH_SCORE_POLICY.maxPageScore, Math.max(0, value))
  )
}

function confidenceMultiplier(confidence: number): number {
  return 0.75 + confidence / 400
}

function familyOccurrenceKey(finding: IntelligenceFindingDraft): string {
  const meta = getRuleMetadata(finding.ruleId)
  const profile = meta ? resolveRuleScoringProfile(meta) : null
  const family = profile?.ruleFamily ?? finding.ruleId
  return `${family}:${finding.pageId ?? "site"}`
}

/**
 * Computes penalty units for a single finding using metadata-driven influence.
 */
export function computeFindingPenaltyUnits(
  finding: IntelligenceFindingDraft,
  pages: AuditPage[],
  familyOccurrences: Map<string, number>
): number {
  const meta = getRuleMetadata(finding.ruleId)
  const profile = meta ? resolveRuleScoringProfile(meta) : null

  const baseUnits = SEVERITY_PENALTY_UNITS[finding.severity]
  const influence = profile?.influenceMultiplier ?? 1
  const categoryMultiplier = INTELLIGENCE_CATEGORY_WEIGHTS[finding.category] ?? 0.7
  const confidence = confidenceMultiplier(finding.confidence)

  const familyKey = familyOccurrenceKey(finding)
  const occurrence = familyOccurrences.get(familyKey) ?? 0
  familyOccurrences.set(familyKey, occurrence + 1)
  const familyMultiplier =
    occurrence === 0 ? 1 : GROWTH_SCORE_POLICY.familyRepeatMultiplier ** occurrence

  let pageWeight = 1
  if (finding.scope !== "site" && finding.pageId) {
    const page = pages.find((item) => item.id === finding.pageId)
    pageWeight = page
      ? getPageImportanceWeight(page.pageType, page.path)
      : getPageImportanceWeight("custom" as AuditPageType, "/")
  }

  return baseUnits * influence * categoryMultiplier * confidence * pageWeight * familyMultiplier
}

function unitsToCategoryDrop(totalUnits: number, category: ScoreCategory): number {
  const policy = CATEGORY_SCORING_POLICY[category]
  const ratio = Math.min(1, totalUnits / policy.budget)
  return ratio * (policy.baseline - policy.floor)
}

export function calculateCategoryScoresV3(
  findings: IntelligenceFindingDraft[],
  pages: AuditPage[]
): Record<ScoreCategory, number> {
  const categories: ScoreCategory[] = ["conversion", "trust", "mobile", "ux"]
  const scores = {} as Record<ScoreCategory, number>
  const familyOccurrences = new Map<string, number>()

  for (const category of categories) {
    const categoryFindings = findings.filter((finding) => finding.scoreCategory === category)
    const totalUnits = categoryFindings.reduce(
      (sum, finding) => sum + computeFindingPenaltyUnits(finding, pages, familyOccurrences),
      0
    )

    const drop = unitsToCategoryDrop(totalUnits, category)
    const policy = CATEGORY_SCORING_POLICY[category]
    scores[category] = clampCategoryScore(policy.baseline - drop, category)
  }

  return scores
}

export function calculateOptimalCategoryScores(): Record<ScoreCategory, number> {
  const categories: ScoreCategory[] = ["conversion", "trust", "mobile", "ux"]
  const scores = {} as Record<ScoreCategory, number>

  for (const category of categories) {
    scores[category] = CATEGORY_SCORING_POLICY[category].ceiling
  }

  return scores
}

export function calculateUncappedGrowthScoreV3(
  categoryScores: Record<ScoreCategory, number>
): number {
  const weighted =
    categoryScores.conversion * CATEGORY_SCORING_POLICY.conversion.growthWeight +
    categoryScores.trust * CATEGORY_SCORING_POLICY.trust.growthWeight +
    categoryScores.mobile * CATEGORY_SCORING_POLICY.mobile.growthWeight +
    categoryScores.ux * CATEGORY_SCORING_POLICY.ux.growthWeight

  return clampGrowthScore(weighted)
}

export function calculatePageScoreV3(
  page: AuditPage,
  findings: IntelligenceFindingDraft[],
  options?: { analyzed?: boolean }
): number {
  if (options?.analyzed === false) return 0

  const pageFindings = findings.filter((finding) => finding.pageId === page.id)
  const familyOccurrences = new Map<string, number>()

  const totalUnits = pageFindings.reduce(
    (sum, finding) => sum + computeFindingPenaltyUnits(finding, [page], familyOccurrences),
    0
  )

  // Map units to page score drop — page budget approximates ~40 units for full drop
  const pageBudget = 40
  const dropRatio = Math.min(1, totalUnits / pageBudget)
  const drop = dropRatio * GROWTH_SCORE_POLICY.pageScoreBase

  return clampPageScore(GROWTH_SCORE_POLICY.pageScoreBase - drop)
}

export function calculateAllPageScoresV3(
  pages: AuditPage[],
  findings: IntelligenceFindingDraft[],
  analyzedPageIds?: Set<string>
): Record<string, number> {
  const scores: Record<string, number> = {}

  for (const page of pages) {
    const analyzed = analyzedPageIds ? analyzedPageIds.has(page.id) : true
    scores[page.id] = calculatePageScoreV3(page, findings, { analyzed })
  }

  return scores
}

/**
 * Calibrated Hybrid Growth Model — Scoring Engine V3
 *
 * 1. Deduct penalty units per finding (metadata-driven)
 * 2. Roll up four category scores from baselines
 * 3. Weighted Growth Score (38/28/18/16)
 * 4. Apply blocker ceiling resolver
 * 5. Compute audit confidence and growth potential
 */
export function calculateAuditScoreV3(
  findings: IntelligenceFindingDraft[],
  pages: AuditPage[],
  options: ScoringEngineV3Options = {}
): ScoringEngineV3Result {
  const categories = calculateCategoryScoresV3(findings, pages)
  const uncappedGrowthScore = calculateUncappedGrowthScoreV3(categories)
  const { scoreCeiling, appliedBlockers } = resolveBlockerCeiling(findings, pages)
  const growthScore = Math.min(uncappedGrowthScore, scoreCeiling)

  const analyzedPageIds =
    options.analyzedPageIds ??
    new Set(pages.map((page) => page.id))

  const pageScores = calculateAllPageScoresV3(pages, findings, analyzedPageIds)

  const optimalCategories = calculateOptimalCategoryScores()

  const auditConfidence = calculateAuditConfidence({
    pages,
    analyzedPageIds,
    pageSnapshots: options.pageSnapshots ?? [],
    findings,
    applicableRuleCount: options.applicableRuleCount ?? 0,
    executedRuleCount: options.executedRuleCount ?? 0,
  })

  const growthPotential = calculateGrowthPotential({
    currentGrowthScore: growthScore,
    uncappedGrowthScore,
    scoreCeiling,
    categories,
    optimalCategories,
    findings,
  })

  return {
    categories,
    growthScore,
    uncappedGrowthScore,
    scoreCeiling,
    appliedBlockers,
    pageScores,
    auditConfidence,
    growthPotential,
    engineVersion: "Intelligence v3",
  }
}

/** Bridge for legacy page score display from persisted findings without rule metadata */
export function calculatePageScoreFromAuditFindingsV3(
  page: AuditPage,
  findings: Array<{ pageId?: string; severity: FindingSeverity }>,
  options?: { analyzed?: boolean }
): number {
  if (options?.analyzed === false) return 0

  const pageFindings = findings.filter((finding) => finding.pageId === page.id)
  const penalty = pageFindings.reduce(
    (total, finding) => total + SEVERITY_PENALTY_UNITS[finding.severity] * 2,
    0
  )

  return clampPageScore(GROWTH_SCORE_POLICY.pageScoreBase - penalty)
}
