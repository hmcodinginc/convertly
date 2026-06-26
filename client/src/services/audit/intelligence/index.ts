import { createLegacyRuleDefinitions } from "@/services/audit/intelligence/rules/legacyRuleAdapter"
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

  registry.registerMany(createLegacyRuleDefinitions())
}

export { runIntelligenceEngine } from "@/services/audit/intelligence/execution/auditIntelligenceEngine"
export { getRuleRegistry } from "@/services/audit/intelligence/rules/ruleRegistry"
export { calculateAuditScoreV2, calculatePageScore, calculatePageScoreFromAuditFindings } from "@/services/audit/intelligence/scoring/scoringEngineV2"
export { buildRecommendations } from "@/services/audit/intelligence/recommendations/recommendationEngine"
export { getPageImportanceWeight, resolvePageImportanceTier } from "@/services/audit/intelligence/pageImportance"
export { BUSINESS_PROFILES, DEFAULT_BUSINESS_PROFILE } from "@/services/audit/intelligence/businessProfiles"
export { INTELLIGENCE_CATEGORIES } from "@/services/audit/intelligence/categories"

export type {
  IntelligenceFindingDraft,
  IntelligenceExecutionResult,
  RecommendationDraft,
  BusinessProfileContext,
} from "@/services/audit/intelligence/types"

export type { RuleDefinition } from "@/services/audit/intelligence/rules/ruleDefinition"
