import type { Audit, AuditDetail, Issue, Recommendation } from "@/types/audit"
import type { DashboardMetric, OpportunityItem } from "@/types/dashboard"

const severityToImpact = (severity: string): OpportunityItem["impact"] => {
  if (severity === "Critical" || severity === "high" || severity === "High") return "High"
  if (severity === "Medium" || severity === "medium") return "Medium"
  return "Low"
}

const severityRank = (severity: string): number => {
  const map: Record<string, number> = {
    Critical: 0,
    High: 1,
    high: 1,
    Medium: 2,
    medium: 2,
    Low: 3,
    low: 3,
  }
  return map[severity] ?? 4
}

const impactScore = (severity: string): number => {
  if (severity === "Critical") return 95
  if (severity === "High" || severity === "high") return 85
  if (severity === "Medium" || severity === "medium") return 70
  return 55
}

function issueToOpportunity(issue: Issue, pageFallback: string): OpportunityItem {
  return {
    id: issue.id,
    page: issue.page ?? pageFallback,
    issue: issue.issue,
    impact: severityToImpact(issue.severity),
    score: impactScore(issue.severity),
    status: "Open",
  }
}

export function sortAuditsNewestFirst(audits: Audit[]): Audit[] {
  return [...audits].sort((a, b) => {
    const aCompleted = a.status === "completed" || a.status === "Completed"
    const bCompleted = b.status === "completed" || b.status === "Completed"
    if (aCompleted !== bCompleted) return aCompleted ? -1 : 1

    const aTime = auditRecencyMs(a)
    const bTime = auditRecencyMs(b)
    if (aTime !== bTime) return bTime - aTime

    return b.id.localeCompare(a.id)
  })
}

function auditRecencyMs(audit: Audit): number {
  if (audit.updatedAtIso) {
    const iso = Date.parse(audit.updatedAtIso)
    if (!Number.isNaN(iso)) return iso
  }

  // Fallback for formatted display strings: "Jul 21, 2024 • 04:05 PM"
  const parsed = Date.parse(audit.completedAt.replace(" • ", " "))
  return Number.isNaN(parsed) ? 0 : parsed
}

export function getDefaultSelectedAuditId(audits: Audit[]): string | null {
  const sorted = sortAuditsNewestFirst(audits)
  const completed = sorted.find(
    (audit) => audit.status === "completed" || audit.status === "Completed"
  )
  return completed?.id ?? sorted[0]?.id ?? null
}

export function buildOpportunitiesFromAuditDetail(detail: AuditDetail): OpportunityItem[] {
  const siteWide = detail.siteFindings.map((finding) =>
    issueToOpportunity(
      {
        id: finding.id,
        issue: finding.issue,
        severity: finding.severity,
        impact: finding.impact,
        recommendation: finding.recommendation,
        category: finding.category,
      },
      "Site-wide"
    )
  )

  const pageIssues = detail.issues.map((issue) => issueToOpportunity(issue, issue.page ?? "/"))

  return [...siteWide, ...pageIssues]
    .sort((a, b) => severityRank(b.impact) - severityRank(a.impact))
    .slice(0, 5)
}

export function buildRecommendationsFromAuditDetail(detail: AuditDetail): Recommendation[] {
  if (detail.recommendations.length > 0) {
    return detail.recommendations.slice(0, 4)
  }

  return buildOpportunitiesFromAuditDetail(detail)
    .slice(0, 4)
    .map((item, index) => ({
      id: `rec-${item.id}`,
      title: item.issue,
      summary: "Address this finding to improve conversion performance.",
      priority: index === 0 ? "Critical" : index < 3 ? "High" : "Medium",
      estimatedLift: "Fix to improve Growth Score",
      category: "conversion",
    }))
}

export function countCriticalFindings(detail: AuditDetail): number {
  const criticalIssues = detail.issues.filter((issue) => issue.severity === "Critical").length
  const criticalSite = detail.siteFindings.filter((finding) => finding.severity === "Critical").length
  return criticalIssues + criticalSite
}

export function mergeMetricsForSelectedAudit(
  workspaceMetrics: DashboardMetric[],
  detail: AuditDetail | null
): DashboardMetric[] {
  const criticalCount = detail ? countCriticalFindings(detail) : 0
  const findingsCount = detail?.stats.totalFindings ?? 0

  return workspaceMetrics.map((metric) => {
    if (metric.id === "growth-score") {
      return {
        ...metric,
        label: "Average Growth Score",
        hint: "Average score across completed audits.",
      }
    }

    if (metric.id === "findings-count" && detail) {
      return {
        ...metric,
        value: String(findingsCount),
        change: `${criticalCount} critical`,
        trend: criticalCount > 0 ? "down" : "up",
        hint: `Findings in ${detail.domain}`,
      }
    }

    if (metric.id === "critical-findings" && detail) {
      const pct =
        findingsCount > 0 ? `${Math.round((criticalCount / findingsCount) * 100)}%` : "0%"
      return {
        ...metric,
        value: String(criticalCount),
        change: pct,
        trend: criticalCount > 0 ? "down" : "neutral",
        hint: `Critical issues in ${detail.domain}`,
      }
    }

    return metric
  })
}
