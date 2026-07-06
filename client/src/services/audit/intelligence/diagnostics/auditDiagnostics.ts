import { createLogger, isAuditDebugEnabled } from "@/lib/logger"
import type { DetectedPageIntent } from "@/services/audit/intelligence/pageIntentTypes"
import type { DetectedWebsiteIntent } from "@/services/audit/intelligence/websiteIntentTypes"
import type { RuleExecutionSummary } from "@/services/audit/intelligence/execution/ruleExecutionTracker"
import type { ConsultantRecommendation } from "@/services/audit/intelligence/recommendations/consultantRecommendation"
import type { ScoreExplanation } from "@/services/audit/intelligence/scoring/scoreExplanation"
import type { AuditConfidenceResult } from "@/services/audit/intelligence/scoring/auditConfidence"
import type { PageScoreBreakdown } from "@/services/audit/intelligence/scoring/pageScoreDiagnostics"
import { PAGE_SCORE_EQUATION } from "@/services/audit/intelligence/recommendations/consultantRecommendation"

const diagnosticsLogger = createLogger("diagnostics")

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

export function isAuditDiagnosticsEnabled(): boolean {
  return isAuditDebugEnabled()
}

export function logAuditDiagnostics(bundle: AuditDiagnosticsBundle): void {
  if (!isAuditDiagnosticsEnabled()) return

  diagnosticsLogger.debug("Audit diagnostics bundle", {
    pages: bundle.pageDiagnostics.length,
    growthScore: bundle.scoreExplanation.growthScore,
    websiteIntent: bundle.websiteIntent?.websiteIntent,
    scoreEquation: bundle.pageDiagnostics[0]?.finalEquation ?? PAGE_SCORE_EQUATION,
    scoreExplanation: bundle.scoreExplanation,
    confidence: {
      score: bundle.auditConfidence.score,
      label: bundle.auditConfidence.label,
      reasons: bundle.auditConfidence.confidenceReasons,
      warnings: bundle.auditConfidence.confidenceWarnings,
    },
    ruleExecution: bundle.ruleExecution,
    pageScores: bundle.pageDiagnostics.map((page) => ({
      path: page.path,
      intent: page.pageIntent,
      score: page.scoreBreakdown.finalScore,
      penalty: page.scoreBreakdown.weightedPenalty,
    })),
  })
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
