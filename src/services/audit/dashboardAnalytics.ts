import { buildAuditListEntryFromSession, resolveGrowthScore } from "@/services/audit/auditDetailBuilder"
import {
  getAuditSessionData,
  getFindingsByUserId,
  getSessionsByUserId,
} from "@/services/repositories/audit/provider"
import type { Audit, Recommendation } from "@/types/audit"
import type { DashboardMetric, OpportunityItem } from "@/types/dashboard"
import type { AuditFinding, AuditSession } from "@/types/auditEngine"

function severityToImpact(severity: AuditFinding["severity"]): OpportunityItem["impact"] {
  if (severity === "critical" || severity === "high") return "High"
  if (severity === "medium") return "Medium"
  return "Low"
}

async function loadUserSessions(userId: string): Promise<AuditSession[]> {
  return getSessionsByUserId(userId)
}

export async function buildDashboardMetrics(userId: string): Promise<DashboardMetric[]> {
  const sessions = await loadUserSessions(userId)
  const completedSessions = sessions.filter((session) => session.status === "completed")

  const completedData = await Promise.all(
    completedSessions.map((session) => getAuditSessionData(session.id))
  )

  const validData = completedData.filter((data) => data != null)
  const growthScores = validData.map((data) => resolveGrowthScore(data))
  const averageGrowth =
    growthScores.length > 0
      ? Math.round(growthScores.reduce((sum, score) => sum + score, 0) / growthScores.length)
      : 0

  const findings = await getFindingsByUserId(userId)
  const criticalFindings = findings.filter((finding) => finding.severity === "critical").length

  return [
    {
      id: "growth-score",
      label: "Growth Score",
      value: averageGrowth > 0 ? String(averageGrowth) : "—",
      change: `${completedSessions.length} audits`,
      trend: averageGrowth >= 70 ? "up" : averageGrowth > 0 ? "neutral" : "neutral",
      hint: "Average weighted score across completed audits",
    },
    {
      id: "total-audits",
      label: "Total audits",
      value: String(sessions.length),
      change: `${completedSessions.length} completed`,
      trend: "neutral",
      hint: "Audits in your workspace",
    },
    {
      id: "findings-count",
      label: "Findings",
      value: String(findings.length),
      change: `${criticalFindings} critical`,
      trend: criticalFindings > 0 ? "down" : "up",
      hint: "Issues detected across all audits",
    },
    {
      id: "critical-findings",
      label: "Critical findings",
      value: String(criticalFindings),
      change: findings.length > 0 ? `${Math.round((criticalFindings / findings.length) * 100)}%` : "0%",
      trend: criticalFindings > 0 ? "down" : "neutral",
      hint: "Highest-priority issues requiring action",
    },
  ]
}

export async function buildOpportunityQueue(userId: string): Promise<OpportunityItem[]> {
  const findings = await getFindingsByUserId(userId)
  const pagePathById = new Map<string, string>()

  const auditIds = [...new Set(findings.map((finding) => finding.auditId))]
  const sessionDataList = await Promise.all(auditIds.map((id) => getAuditSessionData(id)))

  for (const sessionData of sessionDataList) {
    if (!sessionData) continue
    for (const page of sessionData.pages) {
      pagePathById.set(page.id, page.path)
    }
  }

  return [...findings]
    .sort((a, b) => {
      const rank = { critical: 0, high: 1, medium: 2, low: 3 }
      return rank[a.severity] - rank[b.severity]
    })
    .slice(0, 5)
    .map((finding) => ({
      id: finding.id,
      page: finding.pageId ? (pagePathById.get(finding.pageId) ?? "/") : "Site-wide",
      issue: finding.title,
      impact: severityToImpact(finding.severity),
      score: finding.severity === "critical" ? 95 : finding.severity === "high" ? 85 : 70,
      status: "Open",
    }))
}

export async function buildDashboardRecommendations(userId: string): Promise<Recommendation[]> {
  const findings = await getFindingsByUserId(userId)

  return [...findings]
    .sort((a, b) => {
      const rank = { critical: 0, high: 1, medium: 2, low: 3 }
      return rank[a.severity] - rank[b.severity]
    })
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

export async function getUserAudits(userId: string): Promise<Audit[]> {
  const sessions = await loadUserSessions(userId)
  const audits: Audit[] = []

  for (const session of sessions) {
    const data = await getAuditSessionData(session.id)
    if (data) {
      audits.push(buildAuditListEntryFromSession(data))
    }
  }

  return audits
}

export async function userHasAudits(userId: string): Promise<boolean> {
  const sessions = await loadUserSessions(userId)
  return sessions.length > 0
}