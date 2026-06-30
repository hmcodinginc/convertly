import { buildProductionRuleDefinitions } from "@/services/audit/intelligence/rules/buildProductionRules"
import { getRuleRegistry } from "@/services/audit/intelligence/rules/ruleRegistry"

/**
 * Idempotent engine bootstrap. Safe across Vite HMR — the registry lives on
 * globalThis, so re-importing this module does not re-register production rules.
 */
export function bootstrapIntelligenceEngine(): void {
  const registry = getRuleRegistry()

  if (registry.isInitialized()) {
    return
  }

  registry.registerMany(buildProductionRuleDefinitions())
}

export { runIntelligenceEngine } from "@/services/audit/intelligence/execution/auditIntelligenceEngine"
export { getRuleRegistry } from "@/services/audit/intelligence/rules/ruleRegistry"
export {
  calculateAuditScoreV2,
  calculateAuditScoreV3,
  calculatePageScore,
  calculatePageScoreFromAuditFindings,
  resolveBlockerCeiling,
  calculateAuditConfidence,
  calculateGrowthPotential,
  SCORING_ENGINE_VERSION,
} from "@/services/audit/intelligence/scoring/scoringEngineV2"
export { buildRecommendations } from "@/services/audit/intelligence/recommendations/recommendationEngine"
export { getPageImportanceWeight, resolvePageImportanceTier } from "@/services/audit/intelligence/pageImportance"
export { BUSINESS_PROFILES, DEFAULT_BUSINESS_PROFILE } from "@/services/audit/intelligence/businessProfiles"
export { INTELLIGENCE_CATEGORIES } from "@/services/audit/intelligence/categories"
export { getRuleIdsForPageType, getSiteRuleIds, RULE_PACKS } from "@/services/audit/intelligence/rules/rulePacks"
export { getRuleMetadata, RULE_METADATA } from "@/services/audit/intelligence/rules/ruleMetadata"
export {
  enrichRuleMetadata,
  resolveRuleScoringProfile,
  BLOCKER_RULE_OVERRIDES,
} from "@/services/audit/intelligence/rules/ruleScoringMetadata"
export type { RuleMetadataV2, RuleScoringProfile } from "@/services/audit/intelligence/rules/ruleScoringMetadata"
export type { ScoringEngineV3Result, AppliedBlocker } from "@/services/audit/intelligence/scoring/scoringEngineV2"

export type {
  IntelligenceFindingDraft,
  IntelligenceExecutionResult,
  RecommendationDraft,
  BusinessProfileContext,
} from "@/services/audit/intelligence/types"

export type { RuleDefinition } from "@/services/audit/intelligence/rules/ruleDefinition"
export type { RulePackId } from "@/services/audit/intelligence/rules/rulePacks"
