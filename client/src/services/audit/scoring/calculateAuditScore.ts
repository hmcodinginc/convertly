import type { AuditFindingInput, FindingSeverity } from "@/types/auditEngine"

export type ScoreCategory = "conversion" | "trust" | "mobile" | "ux"

export type ScoredFindingInput = AuditFindingInput & {
  ruleId: string
  scoreCategory: ScoreCategory
}

const SEVERITY_PENALTY: Record<FindingSeverity, number> = {
  critical: 18,
  high: 12,
  medium: 7,
  low: 4,
}

const CATEGORY_BASE: Record<ScoreCategory, number> = {
  conversion: 90,
  trust: 88,
  mobile: 86,
  ux: 88,
}

const CATEGORY_WEIGHTS: Record<ScoreCategory, number> = {
  conversion: 0.35,
  trust: 0.25,
  mobile: 0.2,
  ux: 0.2,
}

const MIN_CATEGORY_SCORE = 38
const MAX_CATEGORY_SCORE = 93
const MAX_GROWTH_SCORE = 94

function clampScore(value: number, min = MIN_CATEGORY_SCORE, max = MAX_CATEGORY_SCORE): number {
  return Math.round(Math.min(max, Math.max(min, value)))
}

export function calculateCategoryScores(
  findings: ScoredFindingInput[]
): Record<ScoreCategory, number> {
  const categories: ScoreCategory[] = ["conversion", "trust", "mobile", "ux"]
  const scores = {} as Record<ScoreCategory, number>

  for (const category of categories) {
    const categoryFindings = findings.filter((finding) => finding.scoreCategory === category)
    const penalty = categoryFindings.reduce(
      (total, finding) => total + SEVERITY_PENALTY[finding.severity],
      0
    )
    scores[category] = clampScore(CATEGORY_BASE[category] - penalty)
  }

  return scores
}

export function calculateGrowthScore(
  categoryScores: Record<ScoreCategory, number>
): number {
  const weighted =
    categoryScores.conversion * CATEGORY_WEIGHTS.conversion +
    categoryScores.trust * CATEGORY_WEIGHTS.trust +
    categoryScores.mobile * CATEGORY_WEIGHTS.mobile +
    categoryScores.ux * CATEGORY_WEIGHTS.ux

  return clampScore(weighted, MIN_CATEGORY_SCORE, MAX_GROWTH_SCORE)
}

export function calculateAuditScore(findings: ScoredFindingInput[]): {
  categories: Record<ScoreCategory, number>
  growthScore: number
} {
  const categories = calculateCategoryScores(findings)
  const growthScore = calculateGrowthScore(categories)

  return { categories, growthScore }
}

export function toPersistedFinding(
  finding: ScoredFindingInput
): AuditFindingInput {
  const { ruleId: _ruleId, scoreCategory: _scoreCategory, ...persisted } = finding
  return persisted
}
