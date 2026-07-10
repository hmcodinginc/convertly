import { getRuleMetadata } from "@/services/audit/intelligence/rules/ruleMetadata"
import type { RuleDifficulty } from "@/services/audit/intelligence/types"
import {
  buildSeedForRuleId,
  DEMO_PLAYBOOKS,
  parseRuleIdFromRecommendationId,
  priorityLabelFromSeverity,
} from "@/services/audit/playbooks/rulePlaybookCatalog"
import type { PlaybookCodeExample } from "@/services/audit/playbooks/rulePlaybookCatalog"
import type { Recommendation, RecommendationPlaybook, RecommendationPriority } from "@/types/audit"

export type PlaybookBuildInput = {
  recommendationId: string
  ruleId?: string
  title?: string
  affectedPaths?: string[]
  priority?: RecommendationPriority
  estimatedLift?: string
}

function formatEstimatedTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round((minutes / 60) * 10) / 10
  return hours === 1 ? "1 hour" : `${hours} hours`
}

function difficultyLabel(difficulty: RuleDifficulty): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}

function buildRecommendationPlaybook(input: PlaybookBuildInput): RecommendationPlaybook {
  const resolvedRuleId =
    input.ruleId ?? parseRuleIdFromRecommendationId(input.recommendationId)

  const demoSeed = DEMO_PLAYBOOKS[input.recommendationId]
  const seed =
    demoSeed ??
    (resolvedRuleId
      ? buildSeedForRuleId(resolvedRuleId, input.affectedPaths ?? [], input.priority)
      : buildSeedForRuleId("hero-missing-primary-cta", input.affectedPaths ?? [], input.priority))

  const meta = resolvedRuleId ? getRuleMetadata(resolvedRuleId) : undefined
  const priority =
    input.priority ??
    (meta ? priorityLabelFromSeverity(meta.severity) : ("Medium" as RecommendationPriority))

  const estimatedLift = input.estimatedLift ?? seed.expectedImprovement

  return {
    recommendationId: input.recommendationId,
    ruleId: resolvedRuleId ?? "unknown",
    title: input.title ?? meta?.title ?? "Conversion recommendation",
    priority,
    problem: seed.problem,
    whyItMatters: seed.whyItMatters,
    whyHappened: seed.whyHappened,
    userImpact: seed.userImpact,
    businessImpact: seed.businessImpact,
    technicalExplanation: seed.technicalExplanation,
    priorityReason: seed.priorityReason,
    implementation: seed.implementation,
    exampleCode: seed.exampleCode,
    difficulty: seed.difficulty,
    difficultyLabel: difficultyLabel(seed.difficulty),
    estimatedTime: formatEstimatedTime(seed.estimatedMinutes),
    expectedImprovement: seed.expectedImprovement,
    estimatedLift,
    implementationSteps: seed.implementationSteps,
    checklist: seed.implementationSteps.map((step) => ({
      id: step.slice(0, 48),
      label: step,
      done: false,
    })),
    relatedRecommendations: seed.relatedRuleIds,
  }
}

function playbookFromRecommendation(rec: Recommendation): RecommendationPlaybook {
  return buildRecommendationPlaybook({
    recommendationId: rec.id,
    ruleId: rec.ruleId,
    title: rec.title,
    affectedPaths: rec.affectedPages,
    priority: rec.priority,
    estimatedLift: rec.estimatedLift,
  })
}

export { buildRecommendationPlaybook, playbookFromRecommendation, formatEstimatedTime }
export type { PlaybookCodeExample }
