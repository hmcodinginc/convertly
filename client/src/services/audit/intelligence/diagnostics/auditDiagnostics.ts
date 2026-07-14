import type { DetectedPageIntent } from "@/services/audit/intelligence/pageIntentTypes"
import type { DetectedWebsiteIntent } from "@/services/audit/intelligence/websiteIntentTypes"
import type { RuleExecutionSummary } from "@/services/audit/intelligence/execution/ruleExecutionTracker"
import type { ConsultantRecommendation } from "@/services/audit/intelligence/recommendations/consultantRecommendation"
import type { ScoreExplanation } from "@/services/audit/intelligence/scoring/scoreExplanation"
import type { AuditConfidenceResult } from "@/services/audit/intelligence/scoring/auditConfidence"
import type { PageScoreBreakdown } from "@/services/audit/intelligence/scoring/pageScoreDiagnostics"
import { PAGE_SCORE_EQUATION } from "@/services/audit/intelligence/recommendations/consultantRecommendation"

export type PageDiagnosticReport = {
  pageId: string
  path: string
  pageIntent: string
  scoreBreakdown: PageScoreBreakdown
  finalEquation: string
}

export type AuditDiagnosticsBundle = {
  engineVersion: string
  generatedAt: string
  websiteIntent?: DetectedWebsiteIntent
  pageIntents: Array<{ pageId: string; path: string; intent: DetectedPageIntent }>
  ruleExecution: RuleExecutionSummary
  scoreExplanation: ScoreExplanation
  auditConfidence: AuditConfidenceResult
  consultantRecommendations: ConsultantRecommendation[]
  pageDiagnostics: PageDiagnosticReport[]
}

export function buildPageDiagnosticReport(input: {
  pageId: string
  path: string
  pageIntent: string
  scoreBreakdown: PageScoreBreakdown
}): PageDiagnosticReport {
  return {
    ...input,
    finalEquation: PAGE_SCORE_EQUATION,
  }
}
