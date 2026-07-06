import type { PageContentSnapshot } from "@/services/audit/pageContentService"
import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import type { IntelligenceCategory } from "@/services/audit/intelligence/categories"
import type { BusinessProfileType } from "@/services/audit/intelligence/businessProfiles"
import type { RuleScope } from "@/services/audit/intelligence/rules/ruleDefinition"
import type { AuditPage, AuditSession, FindingSeverity } from "@/types/auditEngine"

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
  verificationStatus?: import("@/services/audit/intelligence/rendering/renderReliability").FindingVerificationStatus
  detectionOutcome?: import("@/services/audit/intelligence/rendering/renderReliability").DetectionOutcome
  verificationReason?: string
  excludeFromScoring?: boolean
  suppressRecommendation?: boolean
  /**
   * Implementation best practice that still scores via category penalties
   * but does not participate in Growth Score blocker ceilings.
   */
  technicalBestPractice?: boolean
}

export type IntelligenceExecutionResult = {
  findings: IntelligenceFindingDraft[]
  pageScores: Record<string, number>
  siteFindingsCount: number
  pageFindingsCount: number
  analyzedPageIds: string[]
  pageIntents: Record<string, import("@/services/audit/intelligence/pageIntentTypes").DetectedPageIntent>
  ruleExecution?: import("@/services/audit/intelligence/execution/ruleExecutionTracker").RuleExecutionSummary
  scoreExplanation?: import("@/services/audit/intelligence/scoring/scoreExplanation").ScoreExplanation
  reportScoreExplanation?: import("@/services/audit/intelligence/reporting/reportScoreExplanation").ReportScoreExplanation
  consultantRecommendations?: import("@/services/audit/intelligence/recommendations/consultantRecommendation").ConsultantRecommendation[]
  strengths?: import("@/services/audit/intelligence/reporting/auditStrengths").AuditStrength[]
  groupedFindings?: import("@/services/audit/intelligence/findings/groupedFindings").GroupedIntelligenceFinding[]
  websiteIntent?: import("@/services/audit/intelligence/websiteIntentTypes").DetectedWebsiteIntent
  renderConfidence?: import("@/services/audit/intelligence/rendering/renderConfidence").SiteRenderConfidence
  reliabilityReport?: import("@/services/audit/intelligence/rendering/renderReliability").ReliabilityReport
  engineDiagnostics?: import("@/services/audit/intelligence/diagnostics/engineDiagnostics").EngineDiagnostics
}

export type RecommendationDraft = {
  id: string
  ruleId: string
  findingTitle: string
  problem: string
  evidence: string
  businessImpact: string
  businessImpactLabel?: string
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
