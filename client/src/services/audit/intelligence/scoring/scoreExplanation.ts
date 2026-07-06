import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import type { FindingSeverity } from "@/types/auditEngine"
import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"
import type { RuleExecutionSummary } from "@/services/audit/intelligence/execution/ruleExecutionTracker"
import type { GrowthPotentialResult } from "@/services/audit/intelligence/scoring/growthPotential"
import type { ScoringEngineV3Result } from "@/services/audit/intelligence/scoring/scoringEngineV3"
import { computeFindingPenaltyUnits } from "@/services/audit/intelligence/scoring/scoringEngineV4"
import { CATEGORY_SCORING_POLICY_V4 } from "@/services/audit/intelligence/scoring/scoringPolicyV4"
import { isRuleApplicableToWebsiteIntent } from "@/services/audit/intelligence/websiteRuleApplicability"
import type { AuditPage } from "@/types/auditEngine"
import { getRuleMetadata } from "@/services/audit/intelligence/rules/ruleMetadata"
import {
  VIEWPORT_BEST_PRACTICE_EXPLANATION,
  shouldExplainViewportAsBestPractice,
} from "@/services/audit/intelligence/scoring/viewportBlockerEligibility"

export type PenaltyLineItem = {
  ruleId: string
  title: string
  severity: FindingSeverity
  scoreCategory: ScoreCategory
  penaltyUnits: number
  categoryDrop: number
  pageId?: string
  pagePath?: string
  appliesToScore: boolean
}

export type ScoreExplanation = {
  growthScore: number
  potentialScore: number
  recoverablePoints: number
  scoreCeiling: number
  uncappedGrowthScore: number
  categoryPenalties: Record<ScoreCategory, number>
  categoryScores: Record<ScoreCategory, number>
  severityPenaltyUnits: Record<FindingSeverity, number>
  largestPenalties: PenaltyLineItem[]
  rulesPassed: number
  rulesFailed: number
  rulesSkipped: number
  appliedBlockers: ScoringEngineV3Result["appliedBlockers"]
  equation: string
  websiteIntent?: string
  qualityScore?: number
  positiveBonus?: number
  scoreBand?: string
  clusterPenalties?: Array<{
    clusterId: string
    label: string
    rawUnits: number
    cappedUnits: number
    scoreCategory: ScoreCategory
  }>
  deductionTree: string[]
}

function categoryPenaltyFromScore(category: ScoreCategory, score: number): number {
  const policy = CATEGORY_SCORING_POLICY_V4[category]
  return Math.max(0, Math.round(policy.baseline - score))
}

/**
 * Builds a fully traceable score explanation from V4 scoring output and findings.
 */
export function buildScoreExplanation(input: {
  scoring: ScoringEngineV3Result
  growthPotential: GrowthPotentialResult
  findings: IntelligenceFindingDraft[]
  pages: AuditPage[]
  ruleExecution: RuleExecutionSummary
}): ScoreExplanation {
  const { scoring, growthPotential, findings, pages, ruleExecution } = input
  const familyOccurrences = new Map<string, number>()
  const websiteIntent = scoring.websiteIntent?.websiteIntent ?? "unknown"

  const categoryPenalties = {} as Record<ScoreCategory, number>
  const categories: ScoreCategory[] = ["conversion", "trust", "mobile", "ux"]
  for (const category of categories) {
    categoryPenalties[category] = categoryPenaltyFromScore(category, scoring.categories[category])
  }

  const severityPenaltyUnits: Record<FindingSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  }

  const penaltyLines: PenaltyLineItem[] = []

  for (const finding of findings) {
    const appliesToScore =
      isRuleApplicableToWebsiteIntent(finding.ruleId, websiteIntent) &&
      !finding.excludeFromScoring
    const units = appliesToScore
      ? computeFindingPenaltyUnits(finding, pages, familyOccurrences)
      : 0

    if (appliesToScore) {
      severityPenaltyUnits[finding.severity] += units
    }

    const policy = CATEGORY_SCORING_POLICY_V4[finding.scoreCategory]
    const categoryDrop = appliesToScore
      ? (units / policy.budget) * (policy.baseline - policy.floor)
      : 0

    const page = finding.pageId ? pages.find((item) => item.id === finding.pageId) : undefined
    const meta = getRuleMetadata(finding.ruleId)

    penaltyLines.push({
      ruleId: finding.ruleId,
      title: meta?.title ?? finding.title,
      severity: finding.severity,
      scoreCategory: finding.scoreCategory,
      penaltyUnits: Math.round(units * 100) / 100,
      categoryDrop: Math.round(categoryDrop * 100) / 100,
      pageId: finding.pageId,
      pagePath: page?.path,
      appliesToScore,
    })
  }

  const largestPenalties = [...penaltyLines]
    .filter((line) => line.appliesToScore)
    .sort((a, b) => b.penaltyUnits - a.penaltyUnits)
    .slice(0, 12)

  const deductionTree: string[] = [
    `Overall Score: ${scoring.growthScore} (${scoring.scoreBand?.label ?? "Scored"})`,
  ]

  for (const category of categories) {
    const penalty = categoryPenalties[category]
    if (penalty > 0) {
      deductionTree.push(`${category}: -${penalty}`)
    }
  }

  for (const cluster of scoring.clusterPenalties ?? []) {
    if (cluster.cappedUnits > 0) {
      deductionTree.push(`${cluster.label} cluster: -${Math.round(cluster.cappedUnits)} units`)
    }
  }

  if (scoring.positiveScoring && scoring.positiveScoring.totalBonus > 0) {
    deductionTree.push(`Quality bonus: +${scoring.positiveScoring.totalBonus}`)
  }

  if (shouldExplainViewportAsBestPractice(findings, scoring.appliedBlockers)) {
    deductionTree.push(VIEWPORT_BEST_PRACTICE_EXPLANATION)
  }

  const equation = [
    `growth = min(weighted(categories + quality), ceiling=${scoring.scoreCeiling})`,
    `weighted = conv×0.30 + trust×0.20 + ux×0.15 + mobile×0.10 + quality×0.25`,
    `intent = ${websiteIntent}`,
    `result = ${scoring.growthScore}`,
  ].join(" | ")

  return {
    growthScore: scoring.growthScore,
    potentialScore: growthPotential.growthPotential,
    recoverablePoints: growthPotential.recoverablePoints,
    scoreCeiling: scoring.scoreCeiling,
    uncappedGrowthScore: scoring.uncappedGrowthScore,
    categoryPenalties,
    categoryScores: scoring.categories,
    severityPenaltyUnits,
    largestPenalties,
    rulesPassed: ruleExecution.rulesPassed,
    rulesFailed: ruleExecution.rulesFailed,
    rulesSkipped: ruleExecution.rulesSkipped,
    appliedBlockers: scoring.appliedBlockers,
    equation,
    websiteIntent,
    qualityScore: scoring.qualityScore,
    positiveBonus: scoring.positiveScoring?.totalBonus,
    scoreBand: scoring.scoreBand?.label,
    clusterPenalties: scoring.clusterPenalties,
    deductionTree,
  }
}
