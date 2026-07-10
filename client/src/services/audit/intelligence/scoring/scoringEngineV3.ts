import type { FindingSeverity } from "@/types/auditEngine"
import type { AuditPage } from "@/types/auditEngine"
import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"
import type { AppliedBlocker } from "@/services/audit/intelligence/scoring/blockerCeilingResolver"
import type { AuditConfidenceResult } from "@/services/audit/intelligence/scoring/auditConfidence"
import type { GrowthPotentialResult } from "@/services/audit/intelligence/scoring/growthPotential"
import type { PageContentSnapshot } from "@/services/audit/pageContentService"
import type { DetectedWebsiteIntent } from "@/services/audit/intelligence/websiteIntentTypes"
import { SCORING_ENGINE_VERSION } from "@/services/audit/intelligence/scoring/scoringPolicy"
import {
  calculateAuditScoreV4,
  calculateCategoryScoresV4,
  calculateOptimalCategoryScoresV4,
  calculateUncappedGrowthScoreV4,
  calculateAllPageScoresV4,
  calculatePageScoreV4,
  calculatePageScoreFromAuditFindingsV4,
  computeFindingPenaltyUnits,
} from "@/services/audit/intelligence/scoring/scoringEngineV4"

export type ScoringEngineV3Options = {
  analyzedPageIds?: Set<string>
  pageSnapshots?: PageContentSnapshot[]
  applicableRuleCount?: number
  executedRuleCount?: number
  skippedPageCount?: number
  websiteIntent?: DetectedWebsiteIntent
  ruleExecution?: import("@/services/audit/intelligence/execution/ruleExecutionTracker").RuleExecutionSummary
  renderConfidenceScore?: number
  blockedPageCount?: number
  crawlFailureCount?: number
  renderSensitiveUnverifiedRatio?: number
  highRiskPlatform?: boolean
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
  engineVersion: typeof SCORING_ENGINE_VERSION
  websiteIntent?: DetectedWebsiteIntent
  qualityScore?: number
  scoreBand?: import("@/services/audit/intelligence/scoring/scoringPolicyV4").ScoreBand
  clusterPenalties?: import("@/services/audit/intelligence/scoring/scoringEngineV4").ClusterPenaltyBreakdown[]
  positiveScoring?: import("@/services/audit/intelligence/scoring/positiveScoring").PositiveScoringResult
}

export { computeFindingPenaltyUnits }

export function calculateCategoryScoresV3(
  findings: IntelligenceFindingDraft[],
  pages: AuditPage[]
): Record<ScoreCategory, number> {
  return calculateCategoryScoresV4(findings, pages)
}

export function calculateOptimalCategoryScores(): Record<ScoreCategory, number> {
  return calculateOptimalCategoryScoresV4()
}

export function calculateUncappedGrowthScoreV3(
  categoryScores: Record<ScoreCategory, number>,
  qualityScore = 74
): number {
  return calculateUncappedGrowthScoreV4(categoryScores, qualityScore)
}

export function calculatePageScoreV3(
  page: AuditPage,
  findings: IntelligenceFindingDraft[],
  websiteIntent?: DetectedWebsiteIntent
): number {
  return calculatePageScoreV4(
    page,
    findings,
    websiteIntent ?? { websiteIntent: "unknown", confidence: 45, signals: [] }
  )
}

export function calculateAllPageScoresV3(
  pages: AuditPage[],
  findings: IntelligenceFindingDraft[],
  analyzedPageIds?: Set<string>,
  websiteIntent?: DetectedWebsiteIntent
): Record<string, number> {
  return calculateAllPageScoresV4(
    pages,
    findings,
    websiteIntent ?? { websiteIntent: "unknown", confidence: 45, signals: [] },
    analyzedPageIds
  )
}

/**
 * Calibrated Hybrid Growth Model — delegates to Intelligence V4 scoring engine.
 */
export function calculateAuditScoreV3(
  findings: IntelligenceFindingDraft[],
  pages: AuditPage[],
  options: ScoringEngineV3Options = {}
): ScoringEngineV3Result {
  const result = calculateAuditScoreV4(findings, pages, options)

  return {
    categories: result.categories,
    growthScore: result.growthScore,
    uncappedGrowthScore: result.uncappedGrowthScore,
    scoreCeiling: result.scoreCeiling,
    appliedBlockers: result.appliedBlockers,
    pageScores: result.pageScores,
    auditConfidence: result.auditConfidence,
    growthPotential: result.growthPotential,
    engineVersion: SCORING_ENGINE_VERSION,
    websiteIntent: result.websiteIntent,
    qualityScore: result.qualityScore,
    scoreBand: result.scoreBand,
    clusterPenalties: result.clusterPenalties,
    positiveScoring: result.positiveScoring,
  }
}

/** Bridge for legacy page score display from persisted findings without rule metadata */
export function calculatePageScoreFromAuditFindingsV3(
  page: AuditPage,
  findings: Array<{ pageId?: string; severity: FindingSeverity; ruleId?: string }>
): number {
  return calculatePageScoreFromAuditFindingsV4(page, findings)
}
