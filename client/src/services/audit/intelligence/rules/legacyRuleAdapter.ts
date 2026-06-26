import { productionAuditRules } from "@/services/audit/rules/productionRules"
import { toIntelligenceCategory } from "@/services/audit/intelligence/categories"
import {
  getProductionRuleCatalogEntry,
  inferConfidenceFromSeverity,
} from "@/services/audit/intelligence/rules/productionRuleCatalog"
import type { RuleDefinition } from "@/services/audit/intelligence/rules/ruleDefinition"
import { SEVERITY_TO_BUSINESS_IMPACT } from "@/services/audit/intelligence/rules/ruleDefinition"
import type {
  IntelligenceFindingDraft,
  PageRuleContext,
  SiteRuleContext,
} from "@/services/audit/intelligence/types"
import type { AuditRule, AuditRuleContext } from "@/types/auditEngine"
import type { ScoredFindingInput } from "@/services/audit/scoring/calculateAuditScore"

function toAuditRuleContext(
  context: PageRuleContext | SiteRuleContext,
  currentSnapshot?: PageRuleContext["currentSnapshot"]
): AuditRuleContext {
  return {
    session: context.session,
    pages: context.pages,
    pageSnapshots: context.pageSnapshots,
    currentPageSnapshot: currentSnapshot,
  }
}

function legacyRuleToDefinition(legacyRule: AuditRule): RuleDefinition {
  const catalog = getProductionRuleCatalogEntry(legacyRule.id)

  const scope = catalog?.scope ?? "page"
  const appliesTo = catalog?.appliesTo ?? ["homepage"]
  const scoreCategory = catalog?.scoreCategory ?? "ux"
  const businessImpact = catalog?.businessImpact ?? SEVERITY_TO_BUSINESS_IMPACT.medium
  const weight = catalog?.weight ?? 1
  const tags = catalog?.tags ?? [legacyRule.category]

  return {
    id: legacyRule.id,
    version: "v1",
    category: toIntelligenceCategory(legacyRule.category),
    title: legacyRule.name,
    description: legacyRule.name,
    severity: "medium",
    scoreCategory,
    businessImpact,
    weight,
    scope,
    appliesTo,
    tags,
    enabled: true,
    detector: async (context) => {
      const auditContext =
        scope === "page" && "currentSnapshot" in context
          ? toAuditRuleContext(context, context.currentSnapshot)
          : toAuditRuleContext(context)

      const result = await legacyRule.run(auditContext)
      return {
        triggered: result.findings.length > 0,
        evidence: result.findings.map((finding) => ({
          label: finding.title,
          value: finding.description,
        })),
      }
    },
    recommendation: () => "",
  }
}

export function createLegacyRuleDefinitions(): RuleDefinition[] {
  return productionAuditRules.map(legacyRuleToDefinition)
}

export function enrichScoredFinding(
  finding: ScoredFindingInput,
  scope: RuleDefinition["scope"]
): IntelligenceFindingDraft {
  const catalog = getProductionRuleCatalogEntry(finding.ruleId)
  const confidence = inferConfidenceFromSeverity(finding.severity)

  return {
    ruleId: finding.ruleId,
    pageId: finding.pageId,
    category: toIntelligenceCategory(finding.category),
    legacyCategory: finding.category,
    severity: finding.severity,
    scoreCategory: finding.scoreCategory,
    title: finding.title,
    description: finding.description,
    recommendation: finding.recommendation,
    confidence,
    businessImpact: catalog?.businessImpact ?? SEVERITY_TO_BUSINESS_IMPACT[finding.severity],
    weight: catalog?.weight ?? 1,
    scope,
    evidence: [{ label: "Observation", value: finding.description }],
    tags: catalog?.tags ?? [finding.category],
  }
}

export async function runLegacyRule(
  legacyRule: AuditRule,
  context: AuditRuleContext
): Promise<ScoredFindingInput[]> {
  const result = await legacyRule.run(context)
  return result.findings as ScoredFindingInput[]
}
