import { getAuditTypeLabel } from "@/lib/auditTypes"
import type { AuditDetail, Issue, Recommendation } from "@/types/audit"
import type { AuditExecutionState } from "@/types/auditExecution"
import type { VertlyAuditSnapshot } from "@/features/vertly/types"

function countSeverity(issues: Issue[]): {
  critical: number
  high: number
  medium: number
  low: number
} {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 }
  for (const issue of issues) {
    if (issue.severity === "Critical") counts.critical += 1
    else if (issue.severity === "High") counts.high += 1
    else if (issue.severity === "Medium") counts.medium += 1
    else counts.low += 1
  }
  return counts
}

function topIssuesFromDetail(audit: AuditDetail, limit = 5) {
  const combined = [...audit.issues, ...audit.siteFindings]
  return combined
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .slice(0, limit)
    .map((issue) => ({
      id: issue.id,
      issue: issue.issue,
      severity: issue.severity,
      category: issue.category,
      impact: issue.impact,
      page: "page" in issue && typeof issue.page === "string" ? issue.page : undefined,
    }))
}

function severityRank(severity: Issue["severity"]): number {
  switch (severity) {
    case "Critical":
      return 0
    case "High":
      return 1
    case "Medium":
      return 2
    default:
      return 3
  }
}

function topRecommendationsFromDetail(recommendations: Recommendation[], limit = 5) {
  return recommendations.slice(0, limit).map((rec) => ({
    id: rec.id,
    title: rec.title,
    priority: rec.priority,
    category: rec.category,
    estimatedLift: rec.estimatedLift,
    summary: rec.summary,
  }))
}

export function buildVertlyAuditSnapshotFromDetail(
  audit: AuditDetail,
  options?: { auditType?: string }
): VertlyAuditSnapshot {
  const severity = countSeverity([...audit.issues, ...audit.siteFindings])

  return {
    auditId: audit.id,
    website: audit.domain,
    auditType: options?.auditType,
    auditTypeLabel: options?.auditType ? getAuditTypeLabel(options.auditType) : undefined,
    status: String(audit.status),
    overallScore: audit.overallScore,
    scoreDelta: audit.scoreDelta,
    previousScore: audit.previousScore,
    criticalFindings: severity.critical,
    highFindings: severity.high,
    mediumFindings: severity.medium,
    lowFindings: severity.low,
    pagesScanned: audit.pagesAnalyzed,
    topRecommendations: topRecommendationsFromDetail(audit.recommendations),
    topIssues: topIssuesFromDetail(audit),
    scoreBreakdown: audit.scoreBreakdown.map((item) => ({
      label: item.label,
      score: item.score,
      status: item.status,
      topImpacts: item.topImpacts?.map((impact) => ({
        title: impact.title,
        count: impact.count,
        severity: impact.severity,
      })),
    })),
    strengths: audit.runMetadata.strengths?.map((s) => s.label),
    growthPotential: audit.runMetadata.growthPotential,
    scoreCeiling: audit.runMetadata.scoreCeiling,
    totalRecommendations: audit.stats.totalRecommendations,
    totalFindings: audit.stats.totalFindings,
  }
}

export function buildVertlyAuditSnapshotFromExecution(
  state: AuditExecutionState,
  displayProgress: number
): VertlyAuditSnapshot {
  return {
    auditId: state.auditId,
    website: state.domain,
    status: String(state.status),
    progress: displayProgress,
    stage: state.currentStageId,
    currentTask: state.currentTask,
    pagesScanned: state.metrics.pagesAnalyzed || state.metrics.pagesDiscovered,
    criticalFindings: state.metrics.criticalIssues,
    highFindings: state.metrics.highIssues,
    mediumFindings: state.metrics.findingsDetected - state.metrics.criticalIssues - state.metrics.highIssues,
    lowFindings: 0,
    overallScore: state.resultScore,
    topRecommendations: state.resultTopOpportunity
      ? [
          {
            id: "running-top",
            title: state.resultTopOpportunity,
            priority: "High",
            category: "Conversion",
            estimatedLift: "—",
            summary: state.resultTopOpportunity,
          },
        ]
      : [],
    topIssues: [],
  }
}
