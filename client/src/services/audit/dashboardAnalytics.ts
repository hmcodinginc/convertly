import {
  buildAuditListEntryFromSummary,
  resolveGrowthScoreFromScores,
} from "@/services/audit/auditDetailBuilder"
import {
  getAuditListForUser,
  getFindingsWithPagePathsForUser,
} from "@/services/repositories/audit/provider"
import type { Audit, Recommendation } from "@/types/audit"
import type { DashboardMetric, OpportunityItem } from "@/types/dashboard"
import type { AuditFinding } from "@/types/auditEngine"

type WorkspaceData = {
  audits: Audit[]
  findings: AuditFinding[]
  pagePathByPageId: Map<string, string>
  completedGrowthScores: number[]
  sessionCount: number
  completedSessionCount: number
}

function severityToImpact(severity: AuditFinding["severity"]): OpportunityItem["impact"] {
  if (severity === "critical" || severity === "high") return "High"
  if (severity === "medium") return "Medium"
  return "Low"
}

function severityRank(severity: AuditFinding["severity"]): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[severity]
}

async function loadWorkspaceData(userId: string): Promise<WorkspaceData> {
  const inflight = inflightWorkspace.get(userId)
  if (inflight) return inflight

  const request = fetchWorkspaceData(userId).finally(() => {
    inflightWorkspace.delete(userId)
  })

  inflightWorkspace.set(userId, request)
  return request
}

const inflightWorkspace = new Map<string, Promise<WorkspaceData>>()

async function fetchWorkspaceData(userId: string): Promise<WorkspaceData> {
  const [listItems, findingsWithPaths] = await Promise.all([
    getAuditListForUser(userId),
    getFindingsWithPagePathsForUser(userId),
  ])

  const pagePathByPageId = new Map<string, string>()
  const findings: AuditFinding[] = []

  for (const { finding, pagePath } of findingsWithPaths) {
    findings.push(finding)
    if (finding.pageId && pagePath) {
      pagePathByPageId.set(finding.pageId, pagePath)
    }
  }

  const completedGrowthScores = listItems
    .filter((item) => item.session.status === "completed")
    .map((item) => resolveGrowthScoreFromScores(item.scores))
    .filter((score) => score > 0)

  const completedSessionCount = listItems.filter(
    (item) => item.session.status === "completed"
  ).length

  return {
    audits: listItems.map((item) =>
      buildAuditListEntryFromSummary(item.session, item.pageCount, item.scores)
    ),
    findings,
    pagePathByPageId,
    completedGrowthScores,
    sessionCount: listItems.length,
    completedSessionCount,
  }
}

function buildMetricsFromWorkspace(workspace: WorkspaceData): DashboardMetric[] {
  const averageGrowth =
    workspace.completedGrowthScores.length > 0
      ? Math.round(
          workspace.completedGrowthScores.reduce((sum, score) => sum + score, 0) /
            workspace.completedGrowthScores.length
        )
      : 0

  const criticalFindings = workspace.findings.filter(
    (finding) => finding.severity === "critical"
  ).length

  return [
    {
      id: "growth-score",
      label: "Average Growth Score",
      value: averageGrowth > 0 ? String(averageGrowth) : "—",
      change: `${workspace.completedSessionCount} audits`,
      trend: averageGrowth >= 70 ? "up" : averageGrowth > 0 ? "neutral" : "neutral",
      hint: "Average score across completed audits.",
    },
    {
      id: "total-audits",
      label: "Total audits",
      value: String(workspace.sessionCount),
      change: `${workspace.completedSessionCount} completed`,
      trend: "neutral",
      hint: "Audits in your workspace",
    },
    {
      id: "findings-count",
      label: "Findings",
      value: String(workspace.findings.length),
      change: `${criticalFindings} critical`,
      trend: criticalFindings > 0 ? "down" : "up",
      hint: "Issues detected across all audits",
    },
    {
      id: "critical-findings",
      label: "Critical findings",
      value: String(criticalFindings),
      change:
        workspace.findings.length > 0
          ? `${Math.round((criticalFindings / workspace.findings.length) * 100)}%`
          : "0%",
      trend: criticalFindings > 0 ? "down" : "neutral",
      hint: "Highest-priority issues requiring action",
    },
  ]
}

function buildOpportunitiesFromWorkspace(workspace: WorkspaceData): OpportunityItem[] {
  return [...workspace.findings]
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .slice(0, 5)
    .map((finding) => ({
      id: finding.id,
      page: finding.pageId
        ? (workspace.pagePathByPageId.get(finding.pageId) ?? "/")
        : "Site-wide",
      issue: finding.title,
      impact: severityToImpact(finding.severity),
      score: finding.severity === "critical" ? 95 : finding.severity === "high" ? 85 : 70,
      status: "Open",
    }))
}

function buildRecommendationsFromWorkspace(workspace: WorkspaceData): Recommendation[] {
  return [...workspace.findings]
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .slice(0, 4)
    .map((finding, index) => ({
      id: `rec-${finding.id}`,
      title: finding.title,
      summary: finding.recommendation,
      priority: index === 0 ? "Critical" : index < 3 ? "High" : "Medium",
      estimatedLift: "Fix to improve Growth Score",
      category: finding.category,
    }))
}

export type DashboardBundle = {
  metrics: DashboardMetric[]
  opportunities: OpportunityItem[]
  recommendations: Recommendation[]
  audits: Audit[]
  showOnboarding: boolean
}

export async function buildDashboardBundle(userId: string): Promise<DashboardBundle> {
  const workspace = await loadWorkspaceData(userId)

  return {
    metrics: buildMetricsFromWorkspace(workspace),
    opportunities: buildOpportunitiesFromWorkspace(workspace),
    recommendations: buildRecommendationsFromWorkspace(workspace),
    audits: workspace.audits,
    showOnboarding: workspace.sessionCount === 0,
  }
}

export async function getUserAudits(userId: string): Promise<Audit[]> {
  const workspace = await loadWorkspaceData(userId)
  return workspace.audits
}

export async function userHasAudits(userId: string): Promise<boolean> {
  const listItems = await getAuditListForUser(userId)
  return listItems.length > 0
}

export async function buildDashboardMetrics(userId: string): Promise<DashboardMetric[]> {
  const workspace = await loadWorkspaceData(userId)
  return buildMetricsFromWorkspace(workspace)
}

export async function buildOpportunityQueue(userId: string): Promise<OpportunityItem[]> {
  const workspace = await loadWorkspaceData(userId)
  return buildOpportunitiesFromWorkspace(workspace)
}

export async function buildDashboardRecommendations(userId: string): Promise<Recommendation[]> {
  const workspace = await loadWorkspaceData(userId)
  return buildRecommendationsFromWorkspace(workspace)
}
