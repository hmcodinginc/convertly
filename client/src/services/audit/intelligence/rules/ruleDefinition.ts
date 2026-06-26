import type { AuditPageType } from "@/types/auditEngine"
import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import type { IntelligenceCategory } from "@/services/audit/intelligence/categories"
import type {
  BusinessImpactLevel,
  DetectorResult,
  IntelligenceFindingDraft,
  PageRuleContext,
  RuleAppliesTo,
  SiteRuleContext,
} from "@/services/audit/intelligence/types"

export type RuleScope = "page" | "site"

export type RuleVersion = "v1" | "v2"

export type RuleDefinition = {
  id: string
  version: RuleVersion
  category: IntelligenceCategory
  title: string
  description: string
  severity: IntelligenceFindingDraft["severity"]
  scoreCategory: ScoreCategory
  businessImpact: BusinessImpactLevel
  weight: number
  scope: RuleScope
  appliesTo: RuleAppliesTo
  tags: string[]
  enabled: boolean
  detector: (context: PageRuleContext | SiteRuleContext) => Promise<DetectorResult>
  recommendation: (context: PageRuleContext | SiteRuleContext) => string
}

export function ruleAppliesToPage(rule: RuleDefinition, pageType: AuditPageType): boolean {
  if (rule.scope === "site") return false
  if (rule.appliesTo === "all") return true
  return rule.appliesTo.includes(pageType)
}

export function ruleAppliesToSite(rule: RuleDefinition): boolean {
  return rule.scope === "site"
}

export const DEFAULT_RULE_WEIGHT = 1

export const SEVERITY_TO_BUSINESS_IMPACT: Record<
  IntelligenceFindingDraft["severity"],
  BusinessImpactLevel
> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
}
