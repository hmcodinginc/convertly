import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import type { IntelligenceCategory } from "@/services/audit/intelligence/categories"
import type { RulePackId } from "@/services/audit/intelligence/rules/rulePacks"
import type {
  BusinessImpactLevel,
  DetectorResult,
  IntelligenceFindingDraft,
  PageRuleContext,
  SiteRuleContext,
} from "@/services/audit/intelligence/types"

export type RuleScope = "page" | "site"

export type RuleVersion = "v1" | "v2"

export type RuleDefinition = {
  id: string
  version: RuleVersion
  packIds: RulePackId[]
  category: IntelligenceCategory
  title: string
  description: string
  severity: IntelligenceFindingDraft["severity"]
  scoreCategory: ScoreCategory
  businessImpact: BusinessImpactLevel
  weight: number
  scope: RuleScope
  tags: string[]
  enabled: boolean
  detector: (context: PageRuleContext | SiteRuleContext) => Promise<DetectorResult>
  recommendation: (context: PageRuleContext | SiteRuleContext) => string
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
