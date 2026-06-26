import type { AuditPage, AuditPageType, AuditSession, FindingSeverity } from "@/types/auditEngine"
import type { PageContentSnapshot } from "@/services/audit/pageContentService"
import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import type { IntelligenceCategory } from "@/services/audit/intelligence/categories"
import type { BusinessProfileType } from "@/services/audit/intelligence/businessProfiles"
import type { RuleScope } from "@/services/audit/intelligence/rules/ruleDefinition"

export type RuleAppliesTo = AuditPageType[] | "all"

export type RuleDifficulty = "low" | "medium" | "high"

export type BusinessImpactLevel = "critical" | "high" | "medium" | "low"

export type IntelligenceEvidence = {
  label: string
  value: string
}

export type DetectorResult = {
  triggered: boolean
  evidence?: IntelligenceEvidence[]
  confidence?: number
}

export type PageRuleContext = {
  session: AuditSession
  pages: AuditPage[]
  pageSnapshots: PageContentSnapshot[]
  currentSnapshot: PageContentSnapshot
}

export type SiteRuleContext = {
  session: AuditSession
  pages: AuditPage[]
  pageSnapshots: PageContentSnapshot[]
}

export type IntelligenceRuleContext = PageRuleContext | SiteRuleContext

export function isPageRuleContext(
  context: IntelligenceRuleContext
): context is PageRuleContext {
  return "currentSnapshot" in context
}

export type IntelligenceFindingDraft = {
  ruleId: string
  pageId?: string
  category: IntelligenceCategory
  legacyCategory: import("@/types/auditEngine").FindingCategory
  severity: FindingSeverity
  scoreCategory: ScoreCategory
  title: string
  description: string
  recommendation: string
  confidence: number
  businessImpact: BusinessImpactLevel
  weight: number
  scope: RuleScope
  evidence: IntelligenceEvidence[]
  tags: string[]
}

export type IntelligenceExecutionResult = {
  findings: IntelligenceFindingDraft[]
  pageScores: Record<string, number>
  siteFindingsCount: number
  pageFindingsCount: number
  analyzedPageIds: string[]
}

export type RecommendationDraft = {
  id: string
  ruleId: string
  findingTitle: string
  problem: string
  evidence: string
  businessImpact: string
  priority: FindingSeverity
  difficulty: RuleDifficulty
  recommendation: string
  expectedBenefit: string
  implementationSteps: string[]
  confidence: number
  pageId?: string
  category: IntelligenceCategory
}

export type BusinessProfileContext = {
  profile: BusinessProfileType
  enabledRuleIds?: string[]
  categoryWeights?: Partial<Record<IntelligenceCategory, number>>
}
