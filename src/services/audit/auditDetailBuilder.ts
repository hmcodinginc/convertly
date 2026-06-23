import { isAuditInProgress } from "@/lib/auditStatus"
import { parseDomainFromUrl } from "@/lib/auditUrlValidation"
import type {
  AuditDetail,
  Issue,
  PageFinding,
  PageFindingStatus,
  Recommendation,
  RecommendationPriority,
  ScoreBreakdownItem,
  TimelineEvent,
} from "@/types/audit"
import type { AuditSessionData, AuditScoreCategory, FindingSeverity } from "@/types/auditEngine"

const SEVERITY_TO_ISSUE: Record<FindingSeverity, Issue["severity"]> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
}

const SCORE_LABELS: Record<string, ScoreBreakdownItem["label"]> = {
  conversion: "Conversion",
  trust: "Trust",
  mobile: "Mobile",
  ux: "UX",
}

const REPORT_SCORE_CATEGORIES: AuditScoreCategory[] = [
  "conversion",
  "trust",
  "mobile",
  "ux",
]

function formatDisplayDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDisplayTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function buildAuditName(domain: string): string {
  return `${domain} · Conversion audit`
}

function scoreStatus(score: number): ScoreBreakdownItem["status"] {
  if (score >= 80) return "Strong"
  if (score >= 65) return "Needs work"
  return "Critical"
}

function pageStatus(issuesCount: number): PageFindingStatus {
  if (issuesCount === 0) return "Healthy"
  if (issuesCount <= 2) return "At risk"
  return "Critical"
}

function priorityFromSeverity(severity: FindingSeverity, index: number): RecommendationPriority {
  if (severity === "critical" || severity === "high") return index === 0 ? "Critical" : "High"
  if (severity === "medium") return "High"
  return "Medium"
}

function severityRank(severity: FindingSeverity): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[severity]
}

function mapFindingsToIssues(data: AuditSessionData): Issue[] {
  return [...data.findings]
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .map((finding) => ({
      id: finding.id,
      issue: finding.title,
      severity: SEVERITY_TO_ISSUE[finding.severity],
      impact: finding.description,
      page: data.pages.find((page) => page.id === finding.pageId)?.path,
    }))
}

function mapPagesToFindings(data: AuditSessionData): PageFinding[] {
  return data.pages.map((page) => {
    const issuesCount = data.findings.filter((finding) => finding.pageId === page.id).length

    return {
      id: page.id,
      label: page.title,
      path: page.path,
      score: Math.max(35, 94 - issuesCount * 8),
      issuesCount,
      status: pageStatus(issuesCount),
    }
  })
}

function mapFindingsToRecommendations(data: AuditSessionData): Recommendation[] {
  return [...data.findings]
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .slice(0, 8)
    .map((finding, index) => ({
      id: `rec-${finding.id}`,
      title: finding.title,
      summary: finding.recommendation,
      priority: priorityFromSeverity(finding.severity, index),
      estimatedLift: "Impact modeled after fix",
      category: finding.category,
    }))
}

function mapHistoryToTimeline(data: AuditSessionData): TimelineEvent[] {
  return data.history.map((event, index, events) => ({
    id: event.id,
    label: event.message,
    timestamp: `${formatDisplayDate(event.createdAt)} · ${formatDisplayTime(event.createdAt)}`,
    status:
      index === events.length - 1 && isAuditInProgress(event.status)
        ? "in_progress"
        : event.status === "failed"
          ? "pending"
          : "completed",
  }))
}

export function resolveGrowthScore(data: AuditSessionData): number {
  const growth = data.scores.find((score) => score.category === "growth")
  if (growth?.score != null) return Math.round(growth.score)

  const overall = data.scores.find((score) => score.category === "overall")
  if (overall?.score != null) return Math.round(overall.score)

  return 0
}

function buildScoreBreakdown(data: AuditSessionData): ScoreBreakdownItem[] {
  return REPORT_SCORE_CATEGORIES.map((category) => {
    const scoreRecord = data.scores.find((score) => score.category === category)
    const score = Math.round(scoreRecord?.score ?? 0)
    const label = SCORE_LABELS[category] ?? "Conversion"

    return {
      id: category,
      label,
      score,
      trend: "neutral" as const,
      trendValue: "0",
      status: scoreStatus(score),
    }
  })
}

export function buildAuditDetailFromSession(data: AuditSessionData): AuditDetail {
  const { session } = data
  const domain = parseDomainFromUrl(session.websiteUrl)
  const completedAt = formatDisplayDate(session.updatedAt)
  const growthScore = resolveGrowthScore(data)
  const inProgress = isAuditInProgress(session.status)

  return {
    id: session.id,
    name: buildAuditName(domain),
    domain,
    completedAt,
    pagesAnalyzed: data.pages.length,
    overallScore: inProgress ? 0 : growthScore,
    previousScore: 0,
    scoreDelta: 0,
    status: session.status,
    issues: inProgress ? [] : mapFindingsToIssues(data),
    recommendations: inProgress ? [] : mapFindingsToRecommendations(data),
    scoreBreakdown: inProgress ? [] : buildScoreBreakdown(data),
    pageFindings: inProgress ? [] : mapPagesToFindings(data),
    timeline: data.history.length > 0 ? mapHistoryToTimeline(data) : [],
  }
}

export function buildAuditListEntryFromSession(data: AuditSessionData) {
  const domain = parseDomainFromUrl(data.session.websiteUrl)

  return {
    id: data.session.id,
    name: buildAuditName(domain),
    domain,
    websiteUrl: data.session.websiteUrl,
    completedAt: formatDisplayDate(data.session.updatedAt),
    pagesScanned: data.pages.length,
    conversionScore: resolveGrowthScore(data),
    status: data.session.status,
  }
}
