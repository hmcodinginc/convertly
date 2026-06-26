import { isAuditInProgress } from "@/lib/auditStatus"
import { calculatePageScoreFromAuditFindings } from "@/services/audit/intelligence/scoring/scoringEngineV2"
import { parseDomainFromUrl } from "@/lib/auditUrlValidation"
import type {
  AuditDetail,
  Issue,
  PageFinding,
  PageFindingStatus,
  Recommendation,
  RecommendationPriority,
  ScoreBreakdownItem,
  SiteFinding,
  TimelineEvent,
} from "@/types/audit"
import type {
  AuditFinding,
  AuditPageType,
  AuditScore,
  AuditSessionData,
  AuditScoreCategory,
  FindingSeverity,
  PageDiscoveryStatus,
} from "@/types/auditEngine"

const SEVERITY_TO_ISSUE: Record<FindingSeverity, Issue["severity"]> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
}

const SCORE_LABELS: Record<string, ScoreBreakdownItem["label"]> = {
  growth: "Growth",
  conversion: "Conversion",
  trust: "Trust",
  mobile: "Mobile",
  ux: "UX",
}

const PAGE_TYPE_LABELS: Record<AuditPageType, string> = {
  homepage: "Homepage",
  pricing: "Pricing",
  about: "About",
  contact: "Contact",
  services: "Services",
  features: "Features",
  login: "Login",
  signup: "Signup",
  custom: "Custom",
}

const DISCOVERY_STATUS_LABELS: Record<PageDiscoveryStatus, string> = {
  candidate: "Candidate",
  reachable: "Reachable",
  unreachable: "Unreachable",
  unknown: "Unknown",
}

const REPORT_SCORE_CATEGORIES: AuditScoreCategory[] = [
  "growth",
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

function isSiteScopedFinding(finding: AuditFinding): boolean {
  return !finding.pageId
}

function mapPageFindingsToIssues(data: AuditSessionData): Issue[] {
  return [...data.findings]
    .filter((finding) => !isSiteScopedFinding(finding))
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .map((finding) => ({
      id: finding.id,
      issue: finding.title,
      severity: SEVERITY_TO_ISSUE[finding.severity],
      impact: finding.description,
      page: data.pages.find((page) => page.id === finding.pageId)?.path,
    }))
}

function mapSiteFindings(data: AuditSessionData): SiteFinding[] {
  return [...data.findings]
    .filter(isSiteScopedFinding)
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .map((finding) => ({
      id: finding.id,
      issue: finding.title,
      severity: SEVERITY_TO_ISSUE[finding.severity],
      impact: finding.description,
    }))
}

function getAnalyzedPathsFromHistory(
  history: AuditSessionData["history"]
): Set<string> {
  const paths = new Set<string>()

  for (const event of history) {
    const match = event.message.match(/^Analyzed (\S+) —/)
    if (match?.[1]) {
      paths.add(match[1])
    }
  }

  return paths
}

function mapPagesToFindings(data: AuditSessionData): PageFinding[] {
  const analyzedPaths = getAnalyzedPathsFromHistory(data.history)
  const legacyAudit = analyzedPaths.size === 0 && data.session.status === "completed"

  return data.pages.map((page) => {
    const issuesCount = data.findings.filter((finding) => finding.pageId === page.id).length
    const normalizedPath = page.path.replace(/\/$/, "") || "/"
    const analyzed =
      legacyAudit ||
      analyzedPaths.has(page.path) ||
      analyzedPaths.has(normalizedPath)

    return {
      id: page.id,
      label: page.title,
      path: page.path,
      url: page.url,
      pageType: PAGE_TYPE_LABELS[page.pageType],
      discoveryStatus: DISCOVERY_STATUS_LABELS[page.discoveryStatus],
      score: calculatePageScoreFromAuditFindings(page, data.findings, { analyzed }),
      issuesCount,
      status: analyzed ? pageStatus(issuesCount) : "At risk",
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
      estimatedLift: liftLabelForSeverity(finding.severity),
      category: finding.category,
    }))
}

function liftLabelForSeverity(severity: FindingSeverity): string {
  if (severity === "critical" || severity === "high") return "High-impact improvement"
  if (severity === "medium") return "Moderate-impact improvement"
  return "Incremental improvement"
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

export function resolveGrowthScoreFromScores(
  scores: Pick<AuditScore, "category" | "score">[]
): number {
  const growth = scores.find((score) => score.category === "growth")
  if (growth?.score != null) return Math.round(growth.score)

  const overall = scores.find((score) => score.category === "overall")
  if (overall?.score != null) return Math.round(overall.score)

  return 0
}

export function resolveGrowthScore(data: AuditSessionData): number {
  return resolveGrowthScoreFromScores(data.scores)
}

function buildScoreBreakdown(data: AuditSessionData): ScoreBreakdownItem[] {
  const growthScore = resolveGrowthScore(data)

  return REPORT_SCORE_CATEGORIES.map((category) => {
    const scoreRecord = data.scores.find((score) => score.category === category)
    const score =
      category === "growth"
        ? growthScore
        : Math.round(scoreRecord?.score ?? 0)
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
  const createdAt = formatDisplayDate(session.createdAt)
  const completedAtDate =
    session.status === "completed" || session.status === "failed"
      ? formatDisplayDate(session.updatedAt)
      : undefined
  const growthScore = resolveGrowthScore(data)
  const inProgress = isAuditInProgress(session.status)

  return {
    id: session.id,
    name: buildAuditName(domain),
    domain,
    websiteUrl: session.websiteUrl,
    createdAt,
    completedAtDate,
    completedAt: completedAtDate ?? createdAt,
    pagesAnalyzed: data.pages.length,
    overallScore: inProgress ? 0 : growthScore,
    previousScore: 0,
    scoreDelta: 0,
    status: session.status,
    errorMessage: session.errorMessage,
    issues: inProgress ? [] : mapPageFindingsToIssues(data),
    siteFindings: inProgress ? [] : mapSiteFindings(data),
    recommendations: inProgress ? [] : mapFindingsToRecommendations(data),
    scoreBreakdown: inProgress ? [] : buildScoreBreakdown(data),
    pageFindings: inProgress ? [] : mapPagesToFindings(data),
    timeline: data.history.length > 0 ? mapHistoryToTimeline(data) : [],
  }
}

export function buildAuditListEntryFromSession(data: AuditSessionData) {
  return buildAuditListEntryFromSummary(
    data.session,
    data.pages.length,
    data.scores
  )
}

export function buildAuditListEntryFromSummary(
  session: AuditSessionData["session"],
  pageCount: number,
  scores: AuditSessionData["scores"]
) {
  const domain = parseDomainFromUrl(session.websiteUrl)

  return {
    id: session.id,
    name: buildAuditName(domain),
    domain,
    websiteUrl: session.websiteUrl,
    completedAt: formatDisplayDate(session.updatedAt),
    pagesScanned: pageCount,
    conversionScore: resolveGrowthScoreFromScores(scores),
    status: session.status,
  }
}
