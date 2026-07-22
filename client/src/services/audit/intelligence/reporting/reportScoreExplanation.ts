import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import type { ScoreExplanation } from "@/services/audit/intelligence/scoring/scoreExplanation"
import type { ScoringEngineV3Result } from "@/services/audit/intelligence/scoring/scoringEngineV3"
import type { PositiveScoringResult } from "@/services/audit/intelligence/scoring/positiveScoring"
import { VIEWPORT_BEST_PRACTICE_EXPLANATION } from "@/services/audit/intelligence/scoring/viewportBlockerEligibility"

export type ScoreExplanationFactor = {
  label: string
  detail?: string
}

export type ReportScoreExplanation = {
  overallScore: number
  scoreBand: string
  websiteIntent: string
  /** Plain-language note when finding count and score appear to disagree. */
  scoreVsFindingsNote?: string
  majorDeductions: ScoreExplanationFactor[]
  positiveFactors: ScoreExplanationFactor[]
  categorySummary: Array<{
    category: ScoreCategory
    score: number
    penalty: number
  }>
}

const CATEGORY_LABELS: Record<ScoreCategory, string> = {
  conversion: "Conversion",
  trust: "Trust",
  mobile: "Mobile",
  ux: "UX",
}

function clusterDeductionLabel(clusterId: string, label: string): string {
  const normalized = label.toLowerCase()
  if (normalized.includes("hero")) return "Hero messaging"
  if (normalized.includes("lead")) return "Lead capture"
  if (normalized.includes("trust") || normalized.includes("social")) return "Trust signals"
  if (normalized.includes("navigation")) return "Navigation structure"
  if (normalized.includes("content")) return "Content depth"
  return label
}

/**
 * User-facing score explanation built from existing V4 scoring data.
 * Does not alter scoring — only explains it.
 */
export function buildReportScoreExplanation(input: {
  scoring: ScoringEngineV3Result
  scoreExplanation: ScoreExplanation
  positiveScoring?: PositiveScoringResult
  findingsCount?: number
}): ReportScoreExplanation {
  const { scoring, scoreExplanation, positiveScoring } = input
  const websiteIntent = scoreExplanation.websiteIntent ?? scoring.websiteIntent?.websiteIntent ?? "unknown"
  const findingsCount = input.findingsCount ?? 0
  const overallScore = scoring.growthScore

  let scoreVsFindingsNote: string | undefined
  if (findingsCount >= 20 && overallScore >= 80) {
    scoreVsFindingsNote =
      "Many findings are present, but most appear lower-impact. Growth Score weighs conversion and business impact — not raw issue count."
  } else if (findingsCount > 0 && findingsCount <= 5 && overallScore > 0 && overallScore <= 78) {
    scoreVsFindingsNote =
      "Few findings can still lower Growth Score when they are high-weight conversion or trust blockers."
  } else if (findingsCount >= 8) {
    scoreVsFindingsNote =
      "Growth Score measures overall conversion readiness and weighted business impact. It is not based solely on the number of issues."
  }

  const majorDeductions: ScoreExplanationFactor[] = []

  for (const cluster of scoring.clusterPenalties ?? []) {
    if (cluster.cappedUnits <= 0) continue
    majorDeductions.push({
      label: clusterDeductionLabel(cluster.clusterId, cluster.label),
      detail: `Cluster penalty across ${cluster.ruleIds.length} related finding${cluster.ruleIds.length === 1 ? "" : "s"}`,
    })
  }

  const categories: ScoreCategory[] = ["conversion", "trust", "mobile", "ux"]
  for (const category of categories) {
    const penalty = scoreExplanation.categoryPenalties[category]
    if (penalty >= 8 && !majorDeductions.some((item) => item.label === CATEGORY_LABELS[category])) {
      majorDeductions.push({
        label: CATEGORY_LABELS[category],
        detail: `${penalty} point deduction`,
      })
    }
  }

  if (majorDeductions.length === 0) {
    const topPenalties = scoreExplanation.largestPenalties.slice(0, 3)
    for (const penalty of topPenalties) {
      majorDeductions.push({ label: penalty.title })
    }
  }

  const positiveFactors: ScoreExplanationFactor[] = (positiveScoring?.awards ?? [])
    .slice(0, 5)
    .map((award) => ({ label: award.label }))

  if (positiveFactors.length === 0 && (scoreExplanation.positiveBonus ?? 0) > 0) {
    positiveFactors.push({ label: "Quality implementation bonus" })
  }

  if (
    scoreExplanation.deductionTree.some((line) => line === VIEWPORT_BEST_PRACTICE_EXPLANATION)
  ) {
    positiveFactors.push({
      label: "Technical best practice",
      detail: VIEWPORT_BEST_PRACTICE_EXPLANATION,
    })
  }

  const categorySummary = categories.map((category) => ({
    category,
    score: scoreExplanation.categoryScores[category],
    penalty: scoreExplanation.categoryPenalties[category],
  }))

  return {
    overallScore: scoring.growthScore,
    scoreBand: scoreExplanation.scoreBand ?? scoring.scoreBand?.label ?? "Scored",
    websiteIntent,
    scoreVsFindingsNote,
    majorDeductions: majorDeductions.slice(0, 6),
    positiveFactors,
    categorySummary,
  }
}
