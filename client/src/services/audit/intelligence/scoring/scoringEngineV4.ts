import type { FindingSeverity } from "@/types/auditEngine"
import type { AuditPage } from "@/types/auditEngine"
import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import { INTELLIGENCE_CATEGORY_WEIGHTS } from "@/services/audit/intelligence/categories"
import { getPageImportanceWeight } from "@/services/audit/intelligence/pageImportance"
import type { AuditPageType } from "@/types/auditEngine"
import { getRuleMetadata } from "@/services/audit/intelligence/rules/ruleMetadata"
import { resolveRuleScoringProfile } from "@/services/audit/intelligence/rules/ruleScoringMetadata"
import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"
import type { DetectedWebsiteIntent } from "@/services/audit/intelligence/websiteIntentTypes"
import {
  isBlockerExcludedForWebsiteIntent,
  isRuleApplicableToWebsiteIntent,
  resolveWebsiteRuleApplicabilitySpec,
} from "@/services/audit/intelligence/websiteRuleApplicability"
import {
  resolveBlockerCeiling,
  type AppliedBlocker,
} from "@/services/audit/intelligence/scoring/blockerCeilingResolver"
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
  BUSINESS_IMPACT_WEIGHT,
  CATEGORY_SCORING_POLICY_V4,
  GROWTH_SCORE_POLICY_V4,
  PENALTY_CLUSTERS,
  QUALITY_PILLAR_POLICY,
  SEVERITY_IMPACT_WEIGHT,
  clusterIdForRule,
  confidenceMultiplierV4,
  resolveScoreBand,
  SCORING_ENGINE_VERSION_V4,
} from "@/services/audit/intelligence/scoring/scoringPolicyV4"
import { calculatePositiveScoring, type PositiveScoringResult } from "@/services/audit/intelligence/scoring/positiveScoring"
import type { RuleExecutionSummary } from "@/services/audit/intelligence/execution/ruleExecutionTracker"
import { countEvaluatedRulesByCategory } from "@/services/audit/intelligence/execution/ruleExecutionTracker"

export type ScoringEngineV4Options = {
  analyzedPageIds?: Set<string>
  pageSnapshots?: PageContentSnapshot[]
  applicableRuleCount?: number
  executedRuleCount?: number
  skippedPageCount?: number
  websiteIntent?: DetectedWebsiteIntent
  ruleExecution?: RuleExecutionSummary
  renderConfidenceScore?: number
  blockedPageCount?: number
  crawlFailureCount?: number
  renderSensitiveUnverifiedRatio?: number
  highRiskPlatform?: boolean
}

export type ClusterPenaltyBreakdown = {
  clusterId: string
  label: string
  rawUnits: number
  cappedUnits: number
  scoreCategory: ScoreCategory
  ruleIds: string[]
}

export type ScoringEngineV4Result = {
  categories: Record<ScoreCategory, number>
  growthScore: number
  uncappedGrowthScore: number
  scoreCeiling: number
  appliedBlockers: AppliedBlocker[]
  pageScores: Record<string, number>
  auditConfidence: AuditConfidenceResult
  growthPotential: GrowthPotentialResult
  engineVersion: typeof SCORING_ENGINE_VERSION_V4
  websiteIntent: DetectedWebsiteIntent
  qualityScore: number
  positiveScoring: PositiveScoringResult
  scoreBand: ReturnType<typeof resolveScoreBand>
  clusterPenalties: ClusterPenaltyBreakdown[]
  scoringFindingsCount: number
  skippedScoringFindingsCount: number
}

function clampCategoryScore(value: number, category: ScoreCategory): number {
  const policy = CATEGORY_SCORING_POLICY_V4[category]
  return Math.round(Math.min(policy.ceiling, Math.max(policy.floor, value)))
}

function clampGrowthScore(value: number): number {
  return Math.round(
    Math.min(GROWTH_SCORE_POLICY_V4.maxScore, Math.max(GROWTH_SCORE_POLICY_V4.minScore, value))
  )
}

function clampPageScore(value: number): number {
  return Math.round(
    Math.min(GROWTH_SCORE_POLICY_V4.maxPageScore, Math.max(0, value))
  )
}

function familyOccurrenceKey(finding: IntelligenceFindingDraft): string {
  const meta = getRuleMetadata(finding.ruleId)
  const profile = meta ? resolveRuleScoringProfile(meta) : null
  const family = profile?.ruleFamily ?? finding.ruleId
  return `${family}:${finding.pageId ?? "site"}`
}

function baseImpactWeight(finding: IntelligenceFindingDraft): number {
  const spec = resolveWebsiteRuleApplicabilitySpec(finding.ruleId)
  const priorityWeight =
    spec.priority === "critical"
      ? 20
      : spec.priority === "high"
        ? 10
        : spec.priority === "medium"
          ? 5
          : 2

  const severityWeight = SEVERITY_IMPACT_WEIGHT[finding.severity]
  const businessWeight = BUSINESS_IMPACT_WEIGHT[finding.businessImpact]
  const meta = getRuleMetadata(finding.ruleId)
  const profile = meta ? resolveRuleScoringProfile(meta) : null
  const influence = profile?.influenceMultiplier ?? 1

  const base = Math.max(priorityWeight, severityWeight, businessWeight)
  return base * influence * (spec.optional ? 0.65 : 1)
}

/**
 * Computes V4 penalty units for a single applicable finding.
 */
export function computeFindingPenaltyUnitsV4(
  finding: IntelligenceFindingDraft,
  pages: AuditPage[],
  familyOccurrences: Map<string, number>,
  clusterOccurrences: Map<string, number>
): number {
  const baseUnits = baseImpactWeight(finding)
  const categoryMultiplier = INTELLIGENCE_CATEGORY_WEIGHTS[finding.category] ?? 0.7
  const confidence = confidenceMultiplierV4(finding.confidence)

  const familyKey = familyOccurrenceKey(finding)
  const familyOccurrence = familyOccurrences.get(familyKey) ?? 0
  familyOccurrences.set(familyKey, familyOccurrence + 1)
  const familyMultiplier =
    familyOccurrence === 0
      ? 1
      : GROWTH_SCORE_POLICY_V4.familyRepeatMultiplier ** familyOccurrence

  const clusterId = clusterIdForRule(finding.ruleId)
  let clusterMultiplier = 1
  if (clusterId) {
    const clusterKey = `${clusterId}:${finding.pageId ?? "site"}`
    const clusterOccurrence = clusterOccurrences.get(clusterKey) ?? 0
    clusterOccurrences.set(clusterKey, clusterOccurrence + 1)
    clusterMultiplier =
      clusterOccurrence === 0
        ? 1
        : GROWTH_SCORE_POLICY_V4.clusterDiminishingMultiplier ** clusterOccurrence
  }

  let pageWeight = 1
  if (finding.scope !== "site" && finding.pageId) {
    const page = pages.find((item) => item.id === finding.pageId)
    pageWeight = page
      ? getPageImportanceWeight(page.pageType, page.path)
      : getPageImportanceWeight("custom" as AuditPageType, "/")
  }

  return baseUnits * categoryMultiplier * confidence * pageWeight * familyMultiplier * clusterMultiplier
}

function unitsToCategoryDrop(
  totalUnits: number,
  category: ScoreCategory,
  evaluatedRuleCount = 0
): number {
  const policy = CATEGORY_SCORING_POLICY_V4[category]
  const effectiveBudget =
    evaluatedRuleCount > 0
      ? Math.max(policy.budget, evaluatedRuleCount * 2.8)
      : policy.budget
  const ratio = Math.min(1, totalUnits / effectiveBudget)
  return ratio * (policy.baseline - policy.floor)
}

function computeAllPenaltyUnits(
  findings: IntelligenceFindingDraft[],
  pages: AuditPage[]
): Map<string, number> {
  const familyOccurrences = new Map<string, number>()
  const clusterOccurrences = new Map<string, number>()
  const unitsByFinding = new Map<string, number>()

  for (const finding of findings) {
    unitsByFinding.set(
      findingKey(finding),
      computeFindingPenaltyUnitsV4(finding, pages, familyOccurrences, clusterOccurrences)
    )
  }

  return unitsByFinding
}

function applyClusterCaps(
  findings: IntelligenceFindingDraft[],
  pages: AuditPage[]
): {
  adjustedUnitsByRule: Map<string, number>
  clusterPenalties: ClusterPenaltyBreakdown[]
} {
  const rawByCluster = new Map<string, { units: number; ruleIds: Set<string> }>()
  const adjustedUnitsByRule = computeAllPenaltyUnits(findings, pages)

  for (const finding of findings) {
    const units = adjustedUnitsByRule.get(findingKey(finding)) ?? 0
    const clusterId = clusterIdForRule(finding.ruleId)
    if (!clusterId) continue

    const entry = rawByCluster.get(clusterId) ?? { units: 0, ruleIds: new Set<string>() }
    entry.units += units
    entry.ruleIds.add(finding.ruleId)
    rawByCluster.set(clusterId, entry)
  }

  const clusterPenalties: ClusterPenaltyBreakdown[] = []

  for (const cluster of PENALTY_CLUSTERS) {
    const raw = rawByCluster.get(cluster.id)
    if (!raw || raw.units === 0) continue

    const cappedUnits = Math.min(raw.units, cluster.maxPenaltyUnits)
    const scale = cappedUnits / raw.units

    if (scale < 1) {
      for (const finding of findings) {
        if (!cluster.ruleIds.includes(finding.ruleId)) continue
        const key = findingKey(finding)
        const current = adjustedUnitsByRule.get(key) ?? 0
        adjustedUnitsByRule.set(key, current * scale)
      }
    }

    clusterPenalties.push({
      clusterId: cluster.id,
      label: cluster.label,
      rawUnits: Math.round(raw.units * 100) / 100,
      cappedUnits: Math.round(cappedUnits * 100) / 100,
      scoreCategory: cluster.scoreCategory,
      ruleIds: [...raw.ruleIds],
    })
  }

  return { adjustedUnitsByRule, clusterPenalties }
}

function findingKey(finding: IntelligenceFindingDraft): string {
  return `${finding.ruleId}:${finding.pageId ?? "site"}`
}

function filterScoringFindings(
  findings: IntelligenceFindingDraft[],
  websiteIntent: DetectedWebsiteIntent
): {
  scoringFindings: IntelligenceFindingDraft[]
  skippedCount: number
} {
  const scoringFindings: IntelligenceFindingDraft[] = []
  let skippedCount = 0

  for (const finding of findings) {
    if (finding.excludeFromScoring) {
      skippedCount += 1
      continue
    }
    if (isRuleApplicableToWebsiteIntent(finding.ruleId, websiteIntent.websiteIntent)) {
      scoringFindings.push(finding)
    } else {
      skippedCount += 1
    }
  }

  return { scoringFindings, skippedCount }
}

export function calculateCategoryScoresV4(
  findings: IntelligenceFindingDraft[],
  pages: AuditPage[],
  evaluatedRulesByCategory?: Record<ScoreCategory, number>
): Record<ScoreCategory, number> {
  const categories: ScoreCategory[] = ["conversion", "trust", "mobile", "ux"]
  const scores = {} as Record<ScoreCategory, number>
  const { adjustedUnitsByRule } = applyClusterCaps(findings, pages)

  for (const category of categories) {
    const categoryFindings = findings.filter((finding) => finding.scoreCategory === category)
    const totalUnits = categoryFindings.reduce(
      (sum, finding) => sum + (adjustedUnitsByRule.get(findingKey(finding)) ?? 0),
      0
    )

    const evaluatedCount = evaluatedRulesByCategory?.[category] ?? 0
    const drop =
      categoryFindings.length === 0
        ? 0
        : unitsToCategoryDrop(totalUnits, category, evaluatedCount)
    const policy = CATEGORY_SCORING_POLICY_V4[category]
    scores[category] = clampCategoryScore(policy.baseline - drop, category)
  }

  return scores
}

export function calculateOptimalCategoryScoresV4(): Record<ScoreCategory, number> {
  const categories: ScoreCategory[] = ["conversion", "trust", "mobile", "ux"]
  const scores = {} as Record<ScoreCategory, number>

  for (const category of categories) {
    scores[category] = CATEGORY_SCORING_POLICY_V4[category].ceiling
  }

  return scores
}

export function calculateUncappedGrowthScoreV4(
  categoryScores: Record<ScoreCategory, number>,
  qualityScore: number
): number {
  const weighted =
    categoryScores.conversion * CATEGORY_SCORING_POLICY_V4.conversion.growthWeight +
    categoryScores.trust * CATEGORY_SCORING_POLICY_V4.trust.growthWeight +
    categoryScores.mobile * CATEGORY_SCORING_POLICY_V4.mobile.growthWeight +
    categoryScores.ux * CATEGORY_SCORING_POLICY_V4.ux.growthWeight +
    qualityScore * QUALITY_PILLAR_POLICY.growthWeight

  return clampGrowthScore(weighted)
}

function resolveIntentAwareBlockerCeiling(
  findings: IntelligenceFindingDraft[],
  pages: AuditPage[],
  websiteIntent: DetectedWebsiteIntent
): ReturnType<typeof resolveBlockerCeiling> {
  const scoringFindings = findings.filter((finding) => {
    if (finding.excludeFromScoring) return false
    if (!isRuleApplicableToWebsiteIntent(finding.ruleId, websiteIntent.websiteIntent)) {
      return false
    }
    if (isBlockerExcludedForWebsiteIntent(finding.ruleId, websiteIntent.websiteIntent)) {
      return false
    }
    return true
  })

  return resolveBlockerCeiling(scoringFindings, pages, {
    allFindings: scoringFindings,
    websiteIntent: websiteIntent.websiteIntent,
  })
}

export function calculatePageScoreV4(
  page: AuditPage,
  findings: IntelligenceFindingDraft[],
  websiteIntent: DetectedWebsiteIntent
): number {
  const pageFindings = findings.filter(
    (finding) =>
      finding.pageId === page.id &&
      !finding.excludeFromScoring &&
      isRuleApplicableToWebsiteIntent(finding.ruleId, websiteIntent.websiteIntent)
  )

  if (pageFindings.length === 0) {
    return GROWTH_SCORE_POLICY_V4.maxPageScore
  }

  const familyOccurrences = new Map<string, number>()
  const clusterOccurrences = new Map<string, number>()
  const totalUnits = pageFindings.reduce(
    (sum, finding) =>
      sum + computeFindingPenaltyUnitsV4(finding, [page], familyOccurrences, clusterOccurrences),
    0
  )

  const dropRatio = Math.min(1, totalUnits / GROWTH_SCORE_POLICY_V4.pageScoreBudget)
  const drop = dropRatio * GROWTH_SCORE_POLICY_V4.pageScoreBase

  return clampPageScore(GROWTH_SCORE_POLICY_V4.pageScoreBase - drop)
}

export function calculateAllPageScoresV4(
  pages: AuditPage[],
  findings: IntelligenceFindingDraft[],
  websiteIntent: DetectedWebsiteIntent,
  analyzedPageIds?: Set<string>
): Record<string, number> {
  const scores: Record<string, number> = {}

  for (const page of pages) {
    const analyzed = analyzedPageIds ? analyzedPageIds.has(page.id) : true
    scores[page.id] = analyzed
      ? calculatePageScoreV4(page, findings, websiteIntent)
      : GROWTH_SCORE_POLICY_V4.maxPageScore
  }

  return scores
}

/**
 * Intelligence V4 — intent-aware, weighted, clustered, positive scoring engine.
 */
export function calculateAuditScoreV4(
  findings: IntelligenceFindingDraft[],
  pages: AuditPage[],
  options: ScoringEngineV4Options = {}
): ScoringEngineV4Result {
  const websiteIntent = options.websiteIntent ?? {
    websiteIntent: "unknown",
    confidence: 45,
    signals: ["default:unknown"],
  }

  const scoringFindings = filterScoringFindings(findings, websiteIntent)
  const positiveScoring = calculatePositiveScoring({
    findings: scoringFindings.scoringFindings,
    websiteIntent: websiteIntent.websiteIntent,
    pageSnapshots: options.pageSnapshots,
  })

  const evaluatedRulesByCategory = options.ruleExecution
    ? countEvaluatedRulesByCategory(options.ruleExecution)
    : undefined

  const { clusterPenalties } = applyClusterCaps(scoringFindings.scoringFindings, pages)
  const categories = calculateCategoryScoresV4(
    scoringFindings.scoringFindings,
    pages,
    evaluatedRulesByCategory
  )
  const uncappedGrowthScore = calculateUncappedGrowthScoreV4(categories, positiveScoring.qualityScore)
  const { scoreCeiling, appliedBlockers } = resolveIntentAwareBlockerCeiling(
    findings,
    pages,
    websiteIntent
  )
  const growthScore = Math.min(uncappedGrowthScore, scoreCeiling)

  const analyzedPageIds =
    options.analyzedPageIds ?? new Set(pages.map((page) => page.id))

  const pageScores = calculateAllPageScoresV4(
    pages,
    findings,
    websiteIntent,
    analyzedPageIds
  )

  const optimalCategories = calculateOptimalCategoryScoresV4()

  const auditConfidence = calculateAuditConfidence({
    pages,
    analyzedPageIds,
    pageSnapshots: options.pageSnapshots ?? [],
    applicableRuleCount: options.applicableRuleCount ?? 0,
    executedRuleCount: options.executedRuleCount ?? 0,
    skippedPageCount: options.skippedPageCount ?? 0,
    renderConfidenceScore: options.renderConfidenceScore,
    blockedPageCount: options.blockedPageCount,
    crawlFailureCount: options.crawlFailureCount,
    renderSensitiveUnverifiedRatio: options.renderSensitiveUnverifiedRatio,
    highRiskPlatform: options.highRiskPlatform,
  })

  const growthPotential = calculateGrowthPotential({
    currentGrowthScore: growthScore,
    uncappedGrowthScore,
    scoreCeiling,
    categories,
    optimalCategories,
    findings: scoringFindings.scoringFindings,
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
    engineVersion: SCORING_ENGINE_VERSION_V4,
    websiteIntent,
    qualityScore: positiveScoring.qualityScore,
    positiveScoring,
    scoreBand: resolveScoreBand(growthScore),
    clusterPenalties,
    scoringFindingsCount: scoringFindings.scoringFindings.length,
    skippedScoringFindingsCount: scoringFindings.skippedCount,
  }
}

/** Bridge for legacy page score display */
export function calculatePageScoreFromAuditFindingsV4(
  page: AuditPage,
  findings: Array<{ pageId?: string; severity: FindingSeverity; ruleId?: string }>,
  websiteIntent: DetectedWebsiteIntent = {
    websiteIntent: "unknown",
    confidence: 45,
    signals: [],
  }
): number {
  const pageFindings = findings.filter((finding) => finding.pageId === page.id)

  if (pageFindings.length === 0) {
    return GROWTH_SCORE_POLICY_V4.maxPageScore
  }

  const pagePenalty = pageFindings.reduce((total, finding) => {
    if (finding.ruleId && !isRuleApplicableToWebsiteIntent(finding.ruleId, websiteIntent.websiteIntent)) {
      return total
    }
    return total + SEVERITY_IMPACT_WEIGHT[finding.severity] * 1.8
  }, 0)

  const dropRatio = Math.min(1, pagePenalty / GROWTH_SCORE_POLICY_V4.pageScoreBudget)
  const drop = dropRatio * GROWTH_SCORE_POLICY_V4.pageScoreBase

  return clampPageScore(GROWTH_SCORE_POLICY_V4.pageScoreBase - drop)
}

/** Backward-compatible penalty units export for score explanation */
export function computeFindingPenaltyUnits(
  finding: IntelligenceFindingDraft,
  pages: AuditPage[],
  familyOccurrences: Map<string, number>
): number {
  const clusterOccurrences = new Map<string, number>()
  return computeFindingPenaltyUnitsV4(finding, pages, familyOccurrences, clusterOccurrences)
}
