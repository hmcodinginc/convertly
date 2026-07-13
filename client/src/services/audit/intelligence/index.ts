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
export {
  buildConsultantRecommendation,
  consolidateConsultantRecommendations,
} from "@/services/audit/intelligence/recommendations/consultantRecommendation"
export { buildScoreExplanation } from "@/services/audit/intelligence/scoring/scoreExplanation"
export { buildReportScoreExplanation } from "@/services/audit/intelligence/reporting/reportScoreExplanation"
export { buildAuditStrengths } from "@/services/audit/intelligence/reporting/auditStrengths"
export { groupIntelligenceFindings } from "@/services/audit/intelligence/findings/groupedFindings"
export { assessSiteRenderConfidence } from "@/services/audit/intelligence/rendering/renderConfidence"
export { isRenderSensitiveRule, RENDER_SENSITIVE_RULE_IDS } from "@/services/audit/intelligence/rendering/renderSensitiveRules"
export type { CrawlDiagnostics } from "@/services/audit/intelligence/diagnostics/crawlDiagnostics"
export { calculateAuditConfidenceFromSignals } from "@/services/audit/intelligence/scoring/auditConfidenceEngine"
export {
  evaluateRuleApplicability,
  resolveRuleApplicabilitySpec,
  RULE_APPLICABILITY_OVERRIDES,
} from "@/services/audit/intelligence/rules/ruleApplicability"
export { RuleExecutionTracker } from "@/services/audit/intelligence/execution/ruleExecutionTracker"
export {
  buildEngineDiagnostics,
} from "@/services/audit/intelligence/diagnostics/engineDiagnostics"
export type { EngineDiagnostics } from "@/services/audit/intelligence/diagnostics/engineDiagnostics"
export {
  serializeIntelligenceSnapshot,
  parseIntelligenceSnapshotFromHistory,
} from "@/services/audit/intelligence/diagnostics/intelligenceSnapshot"
export { PAGE_INTENT_PROFILES, getPageIntentProfile } from "@/services/audit/intelligence/pageIntentProfiles"
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
export type { RuleMetadataV2 } from "@/services/audit/intelligence/rules/ruleScoringMetadata"
export type { RuleScoringProfile } from "@/services/audit/intelligence/scoring/scoringPolicy"
export type { ScoringEngineV3Result, AppliedBlocker } from "@/services/audit/intelligence/scoring/scoringEngineV2"

export type {
  IntelligenceFindingDraft,
  IntelligenceExecutionResult,
  RecommendationDraft,
  BusinessProfileContext,
} from "@/services/audit/intelligence/types"

export {
  detectPageIntent,
  getRuleIdsForIntent,
  intentToRulePageType,
  isRuleApplicableToIntent,
  PAGE_INTENT_PACKS,
} from "@/services/audit/intelligence/pageIntent"
export { detectWebsiteIntent } from "@/services/audit/intelligence/websiteIntentDetection"
export type { WebsiteIntent, DetectedWebsiteIntent } from "@/services/audit/intelligence/websiteIntentTypes"
export {
  PLATFORM_WEBSITE_INTENTS,
  NON_CRO_WEBSITE_INTENTS,
  isNonCroWebsiteIntent,
} from "@/services/audit/intelligence/websiteIntentTypes"
export {
  isRuleApplicableToWebsiteIntent,
  resolveWebsiteRuleApplicabilitySpec,
} from "@/services/audit/intelligence/websiteRuleApplicability"
export {
  evaluateRuleExecutionApplicability,
  filterApplicableRuleIds,
} from "@/services/audit/intelligence/applicability/applicabilityEngine"
export type {
  RuleApplicabilityContext,
  RuleExecutionApplicability,
  ApplicabilityLayer,
} from "@/services/audit/intelligence/applicability/applicabilityTypes"
export {
  buildPageScoreBreakdown,
  buildAllPageScoreBreakdowns,
  formatPageScoreBreakdownTable,
  computePageLocalPenaltyUnits,
} from "@/services/audit/intelligence/scoring/pageScoreDiagnostics"
export type { PageScoreBreakdown, PageFindingPenaltyLine } from "@/services/audit/intelligence/scoring/pageScoreDiagnostics"
