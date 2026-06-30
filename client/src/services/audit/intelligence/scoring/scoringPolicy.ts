import type { AuditPageType } from "@/types/auditEngine"
import type { FindingSeverity } from "@/types/auditEngine"
import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import type { BusinessProfileType } from "@/services/audit/intelligence/businessProfiles"

/**
 * Calibrated Hybrid Growth Model (CHGM) — Scoring Policy
 *
 * Philosophy:
 * - Category scores deduct from optimistic baselines (not from 100).
 * - Growth Score is a weighted rollup of four pillars, capped by blocker rules.
 * - Rule influence is metadata-driven (impact level, family, foundation flags).
 * - Scores communicate readiness, not perfection — ceilings stay below 100.
 *
 * @see scoringEngineV3.ts
 */

export const SCORING_ENGINE_VERSION = "Intelligence v3" as const

/** Severity penalty units — primary deduction driver within a category budget */
export const SEVERITY_PENALTY_UNITS: Record<FindingSeverity, number> = {
  critical: 10,
  high: 6,
  medium: 3,
  low: 1,
}

/** Legacy flat penalties preserved for V2 compatibility bridge */
export const LEGACY_SEVERITY_PENALTY: Record<FindingSeverity, number> = {
  critical: 18,
  high: 12,
  medium: 7,
  low: 4,
}

export type ImpactLevel = "blocker" | "high" | "medium" | "low" | "advisory"

export const IMPACT_LEVEL_MULTIPLIER: Record<ImpactLevel, number> = {
  blocker: 1.25,
  high: 1.1,
  medium: 1,
  low: 0.75,
  advisory: 0.5,
}

export type BlockerTier = 0 | 1 | 2 | 3

export type BlockerTierDefinition = {
  tier: BlockerTier
  /** Maximum achievable Growth Score while this blocker is active */
  capScore: number
  label: string
}

export const BLOCKER_TIER_DEFINITIONS: Record<BlockerTier, BlockerTierDefinition> = {
  0: { tier: 0, capScore: 55, label: "Functional blocker" },
  1: { tier: 1, capScore: 68, label: "Conversion foundation blocker" },
  2: { tier: 2, capScore: 75, label: "Trust foundation blocker" },
  3: { tier: 3, capScore: 82, label: "Commercial readiness blocker" },
}

export type CategoryScoringPolicy = {
  baseline: number
  floor: number
  ceiling: number
  /** Total penalty units that would move baseline → floor */
  budget: number
  growthWeight: number
}

export const CATEGORY_SCORING_POLICY: Record<ScoreCategory, CategoryScoringPolicy> = {
  conversion: { baseline: 88, floor: 35, ceiling: 92, budget: 53, growthWeight: 0.38 },
  trust: { baseline: 86, floor: 35, ceiling: 91, budget: 51, growthWeight: 0.28 },
  mobile: { baseline: 84, floor: 35, ceiling: 90, budget: 49, growthWeight: 0.18 },
  ux: { baseline: 86, floor: 35, ceiling: 91, budget: 51, growthWeight: 0.16 },
}

export const GROWTH_SCORE_POLICY = {
  minScore: 38,
  maxScore: 94,
  maxPageScore: 96,
  pageScoreBase: 100,
  /** Diminishing multiplier for repeated findings in the same rule family */
  familyRepeatMultiplier: 0.7,
} as const

export type RuleScoringProfile = {
  ruleFamily: string
  businessProfiles: BusinessProfileType[] | "all"
  applicablePageTypes: AuditPageType[] | "all"
  isBlocker: boolean
  blockerTier: BlockerTier | null
  capScore: number | null
  impactLevel: ImpactLevel
  isFoundation: boolean
  /** Resolved influence multiplier — derived from impactLevel unless overridden */
  influenceMultiplier: number
}

export type BlockerRuleOverride = {
  isBlocker: true
  blockerTier: BlockerTier
  capScore?: number
  isFoundation?: boolean
  impactLevel?: ImpactLevel
  applicablePageTypes?: AuditPageType[] | "all"
}
