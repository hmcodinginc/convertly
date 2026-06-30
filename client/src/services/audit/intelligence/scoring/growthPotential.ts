import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"
import { GROWTH_SCORE_POLICY } from "@/services/audit/intelligence/scoring/scoringPolicy"

export type GrowthPotentialInput = {
  currentGrowthScore: number
  uncappedGrowthScore: number
  scoreCeiling: number
  categories: Record<ScoreCategory, number>
  optimalCategories: Record<ScoreCategory, number>
  findings: IntelligenceFindingDraft[]
}

export type GrowthPotentialResult = {
  /**
   * Estimated Growth Score if all detected issues were resolved
   * (subject to normal max, not blocker-free theoretical max).
   */
  growthPotential: number
  /** Points recoverable from current score toward growth potential */
  recoverablePoints: number
  /** Theoretical max if blockers were also resolved */
  theoreticalMax: number
  blockerLift: number
}

/**
 * Estimates achievable score after fixing detected issues.
 *
 * - `growthPotential`: weighted category scores with zero penalties, capped at normal max.
 * - `theoreticalMax`: same but with blocker ceiling removed (assumes foundation fixes).
 * - `recoverablePoints`: growthPotential − currentGrowthScore.
 */
export function calculateGrowthPotential(input: GrowthPotentialInput): GrowthPotentialResult {
  const weightedOptimal =
    input.optimalCategories.conversion * 0.38 +
    input.optimalCategories.trust * 0.28 +
    input.optimalCategories.mobile * 0.18 +
    input.optimalCategories.ux * 0.16

  const clampedOptimal = Math.round(
    Math.min(GROWTH_SCORE_POLICY.maxScore, Math.max(GROWTH_SCORE_POLICY.minScore, weightedOptimal))
  )

  const growthPotential = Math.min(clampedOptimal, input.scoreCeiling)

  const theoreticalMax = Math.min(clampedOptimal, GROWTH_SCORE_POLICY.maxScore)

  const recoverablePoints = Math.max(0, growthPotential - input.currentGrowthScore)
  const blockerLift = Math.max(0, theoreticalMax - growthPotential)

  return {
    growthPotential,
    recoverablePoints,
    theoreticalMax,
    blockerLift,
  }
}
