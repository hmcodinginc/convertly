import { toIntelligenceCategory } from "@/services/audit/intelligence/categories"
import { runPageDetector } from "@/services/audit/intelligence/detectors/pageDetectors"
import { runSiteDetector } from "@/services/audit/intelligence/detectors/siteDetectors"
import {
  formatFindingDescription,
  getRuleRecommendation,
} from "@/services/audit/intelligence/detectors/recommendations"
import type { RuleDefinition } from "@/services/audit/intelligence/rules/ruleDefinition"
import { SEVERITY_TO_BUSINESS_IMPACT } from "@/services/audit/intelligence/rules/ruleDefinition"
import {
  getRuleMetadata,
  inferConfidenceFromSeverity,
  RULE_METADATA,
} from "@/services/audit/intelligence/rules/ruleMetadata"
import type { PageRuleContext, SiteRuleContext } from "@/services/audit/intelligence/types"

export function buildProductionRuleDefinitions(): RuleDefinition[] {
  return RULE_METADATA.map((meta) => {
    const scope = meta.scope

    return {
      id: meta.id,
      version: "v2",
      packIds: meta.packIds,
      category: toIntelligenceCategory(meta.category),
      title: meta.title,
      description: meta.title,
      severity: meta.severity,
      scoreCategory: meta.scoreCategory,
      businessImpact: meta.businessImpact,
      weight: meta.weight,
      scope,
      tags: meta.tags,
      enabled: true,
      detector: async (context) => {
        if (scope === "site") {
          return runSiteDetector(meta.id, context as SiteRuleContext)
        }
        return runPageDetector(meta.id, context as PageRuleContext)
      },
      recommendation: (context) => getRuleRecommendation(meta.id, context),
    }
  })
}

export function buildFindingDescription(
  ruleId: string,
  context: PageRuleContext | SiteRuleContext,
  evidence: Array<{ label: string; value: string }>
): string {
  return formatFindingDescription(ruleId, context, evidence)
}

export function resolveRuleConfidence(
  ruleId: string,
  detectorConfidence?: number
): number {
  const meta = getRuleMetadata(ruleId)
  if (detectorConfidence && detectorConfidence > 0) {
    return Math.round(Math.min(98, Math.max(detectorConfidence, inferConfidenceFromSeverity(meta?.severity ?? "medium"))))
  }
  return inferConfidenceFromSeverity(meta?.severity ?? "medium")
}

export function resolveBusinessImpact(ruleId: string) {
  return getRuleMetadata(ruleId)?.businessImpact ?? SEVERITY_TO_BUSINESS_IMPACT.medium
}
