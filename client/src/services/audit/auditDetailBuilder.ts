import { isInternalHistoryMessage } from "@/features/audits/utils/timelinePresentation"
import { isAuditInProgress } from "@/lib/auditStatus"
import { calculatePageScoreFromAuditFindings } from "@/services/audit/intelligence/scoring/scoringEngineV2"
import { parseIntelligenceSnapshotFromHistory, getPageScoreFromSnapshot } from "@/services/audit/intelligence/diagnostics/intelligenceSnapshot"
import { INTELLIGENCE_CATEGORY_LABELS } from "@/services/audit/intelligence/categories"
import type { ConsultantRecommendation } from "@/services/audit/intelligence/recommendations/consultantRecommendation"
import { RULE_METADATA } from "@/services/audit/intelligence/rules/ruleMetadata"
import { SCORING_ENGINE_VERSION } from "@/services/audit/intelligence/scoring/scoringPolicy"
import { detectWebsiteIntent } from "@/services/audit/intelligence/websiteIntentDetection"
import { isRuleApplicableToWebsiteIntent } from "@/services/audit/intelligence/websiteRuleApplicability"
import { parseDomainFromUrl } from "@/lib/auditUrlValidation"
import {
  formatAuditDateTime,
  formatAuditDuration,
} from "@/lib/formatAuditDateTime"
import type {
  AuditDetail,
  AuditRunMetadata,
  AuditRunStats,
  Issue,
  PageCategoryCount,
  PageFinding,
  PageFindingStatus,
  PageSeverityBreakdown,
  Recommendation,
  RecommendationPriority,
  ScoreBreakdownItem,
  ScoreImpactItem,
  SiteFinding,
  TimelineEvent,
} from "@/types/audit"
import type {
  AuditFinding,
  AuditPageType,
  AuditScore,
  AuditSessionData,
  AuditScoreCategory,
  FindingCategory,
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

const CATEGORY_LABELS: Record<FindingCategory, string> = {
  ux: "UX",
  conversion: "Conversion",
  trust: "Trust",
  performance: "Performance",
  copy: "Copy",
  accessibility: "Accessibility",
  technical: "Technical",
}

const SCORE_CATEGORY_FINDING_CATEGORIES: Record<
  Exclude<AuditScoreCategory, "growth" | "overall" | "clarity" | "friction" | "performance" | "cta_strength">,
  FindingCategory[]
> = {
  conversion: ["conversion", "copy"],
  trust: ["trust"],
  mobile: ["technical", "accessibility"],
  ux: ["ux", "performance"],
}

const REPORT_SCORE_CATEGORIES: AuditScoreCategory[] = [
  "growth",
  "conversion",
  "trust",
  "mobile",
  "ux",
]

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
      recommendation: finding.recommendation,
      category: CATEGORY_LABELS[finding.category],
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
      recommendation: finding.recommendation,
      category: CATEGORY_LABELS[finding.category],
    }))
}

function buildSeverityBreakdown(findings: AuditFinding[]): PageSeverityBreakdown {
  return findings.reduce<PageSeverityBreakdown>(
    (counts, finding) => {
      counts[finding.severity] += 1
      return counts
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  )
}

function buildCategoryBreakdown(findings: AuditFinding[]): PageCategoryCount[] {
  const counts = new Map<string, number>()

  for (const finding of findings) {
    const label = CATEGORY_LABELS[finding.category]
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

function buildTopImpacts(findings: AuditFinding[], limit = 4): ScoreImpactItem[] {
  const grouped = new Map<string, { title: string; severity: FindingSeverity; count: number }>()

  for (const finding of findings) {
    const existing = grouped.get(finding.title)
    if (existing) {
      existing.count += 1
      if (severityRank(finding.severity) < severityRank(existing.severity)) {
        existing.severity = finding.severity
      }
      continue
    }

    grouped.set(finding.title, {
      title: finding.title,
      severity: finding.severity,
      count: 1,
    })
  }

  return [...grouped.values()]
    .sort(
      (a, b) =>
        severityRank(a.severity) - severityRank(b.severity) || b.count - a.count
    )
    .slice(0, limit)
    .map((item) => ({
      title: item.title,
      count: item.count,
      severity: SEVERITY_TO_ISSUE[item.severity],
    }))
}

function findingsForScoreCategory(
  findings: AuditFinding[],
  category: AuditScoreCategory
): AuditFinding[] {
  if (category === "growth") return findings

  const categories = SCORE_CATEGORY_FINDING_CATEGORIES[category as keyof typeof SCORE_CATEGORY_FINDING_CATEGORIES]
  if (!categories) return findings

  return findings.filter((finding) => categories.includes(finding.category))
}

function buildRunStats(data: AuditSessionData): AuditRunStats {
  const pageFindingsCount = data.findings.filter((finding) => finding.pageId).length
  const siteFindingsCount = data.findings.filter((finding) => !finding.pageId).length

  return {
    totalFindings: data.findings.length,
    pageFindingsCount,
    siteFindingsCount,
    totalRecommendations: Math.min(data.findings.length, 8),
  }
}

function resolveAuxiliaryScore(
  scores: AuditSessionData["scores"],
  category: "clarity" | "overall" | "friction"
): number | undefined {
  const record = scores.find((score) => score.category === category)
  if (record?.score == null) return undefined
  return Math.round(record.score)
}

function buildRunMetadata(data: AuditSessionData): AuditRunMetadata {
  const analyzedPaths = getAnalyzedPathsFromHistory(data.history)
  const intelligenceSnapshot = parseIntelligenceSnapshotFromHistory(
    data.history.map((event) => event.message)
  )
  const pagesAnalyzed =
    analyzedPaths.size > 0
      ? analyzedPaths.size
      : data.session.status === "completed"
        ? data.pages.length
        : 0

  const auditConfidence = resolveAuxiliaryScore(data.scores, "clarity")
  const growthPotential = resolveAuxiliaryScore(data.scores, "overall")
  const scoreCeiling = resolveAuxiliaryScore(data.scores, "friction")

  return {
    pagesDiscovered: intelligenceSnapshot?.crawlDiagnostics?.pagesDiscovered ?? data.pages.length,
    pagesReachable: data.pages.filter((page) => page.discoveryStatus === "reachable").length,
    pagesUnreachable: data.pages.filter((page) => page.discoveryStatus === "unreachable").length,
    pagesAnalyzed:
      intelligenceSnapshot?.crawlDiagnostics?.pagesAnalyzed ?? pagesAnalyzed,
    findingsCount: data.findings.length,
    siteFindingsCount: data.findings.filter((finding) => !finding.pageId).length,
    pageFindingsCount: data.findings.filter((finding) => finding.pageId).length,
    ruleCount: RULE_METADATA.length,
    auditEngineVersion: SCORING_ENGINE_VERSION,
    auditConfidence,
    auditConfidenceLabel: auditConfidence != null ? confidenceLabelFromScore(auditConfidence) : undefined,
    growthPotential,
    recoverablePoints:
      growthPotential != null
        ? Math.max(0, growthPotential - resolveGrowthScore(data))
        : undefined,
    scoreCeiling,
    blockerCount:
      scoreCeiling != null && scoreCeiling < 94 ? 1 : undefined,
    websiteIntent: intelligenceSnapshot?.websiteIntent?.websiteIntent,
    strengths: intelligenceSnapshot?.strengths,
    reportScoreExplanation: intelligenceSnapshot?.reportScoreExplanation,
    crawlDiagnostics: intelligenceSnapshot?.crawlDiagnostics,
    renderConfidence: intelligenceSnapshot?.renderConfidence,
    reliabilityReport: intelligenceSnapshot?.reliabilityReport,
    auditConfidenceTier: intelligenceSnapshot?.auditConfidenceTier,
    manualVerificationRecommended: intelligenceSnapshot?.manualVerificationRecommended,
  }
}

function confidenceLabelFromScore(score: number): string {
  if (score >= 88) return "High confidence"
  if (score >= 72) return "Moderate confidence"
  if (score >= 55) return "Limited confidence"
  return "Low confidence"
}

function classifyTimelineMessage(message: string): TimelineEvent["kind"] {
  if (message.startsWith("Analyzed ")) return "page-analysis"
  if (message.startsWith("Discovered ")) return "discovery"
  if (message.startsWith("Audit completed")) return "completion"
  if (message === "Discovering public pages") return "phase"
  return "phase"
}

function normalizeAnalyzedPath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed || trimmed === "/") return "/"
  const withoutTrailing = trimmed.replace(/\/+$/, "") || "/"
  return withoutTrailing.startsWith("/") ? withoutTrailing : `/${withoutTrailing}`
}

function getAnalyzedPathsFromHistory(
  history: AuditSessionData["history"]
): Set<string> {
  const paths = new Set<string>()

  for (const event of history) {
    const match = event.message.match(/^Analyzed (\S+) —/)
    if (match?.[1]) {
      paths.add(normalizeAnalyzedPath(match[1]))
    }
  }

  return paths
}

function mapPagesToFindings(data: AuditSessionData): PageFinding[] {
  const analyzedPaths = getAnalyzedPathsFromHistory(data.history)
  const legacyAudit = analyzedPaths.size === 0 && data.session.status === "completed"
  const intelligenceSnapshot = parseIntelligenceSnapshotFromHistory(
    data.history.map((event) => event.message)
  )

  return data.pages.map((page) => {
    const issuesCount = data.findings.filter((finding) => finding.pageId === page.id).length
    const normalizedPath = normalizeAnalyzedPath(page.path)
    const analyzed =
      legacyAudit ||
      analyzedPaths.has(page.path) ||
      analyzedPaths.has(normalizedPath)

    const fallbackScore = calculatePageScoreFromAuditFindings(page, data.findings)
    const score = getPageScoreFromSnapshot(intelligenceSnapshot, page.id, fallbackScore)

    return {
      id: page.id,
      label: page.title,
      path: page.path,
      url: page.url,
      pageType: PAGE_TYPE_LABELS[page.pageType],
      discoveryStatus: DISCOVERY_STATUS_LABELS[page.discoveryStatus],
      score,
      issuesCount,
      status: analyzed ? pageStatus(issuesCount) : "At risk",
      severityBreakdown: buildSeverityBreakdown(
        data.findings.filter((finding) => finding.pageId === page.id)
      ),
      categoryBreakdown: buildCategoryBreakdown(
        data.findings.filter((finding) => finding.pageId === page.id)
      ),
    }
  })
}

function consultantToUiRecommendation(
  rec: ConsultantRecommendation,
  index: number
): Recommendation {
  return {
    id: rec.id,
    ruleId: rec.ruleId,
    title: rec.title,
    summary: `${rec.whyThisMatters} ${rec.recommendation}`,
    priority: priorityFromSeverity(rec.severity, index),
    estimatedLift: rec.businessImpactLabel || rec.businessImpact,
    category:
      INTELLIGENCE_CATEGORY_LABELS[rec.relatedCategory] ?? rec.relatedCategory,
    affectedPages: rec.affectedPaths,
    affectedCount: rec.affectedPaths.length || rec.evidenceCount,
    evidenceCount: rec.evidenceCount,
  }
}

function mapFindingsToRecommendations(data: AuditSessionData): Recommendation[] {
  const intelligenceSnapshot = parseIntelligenceSnapshotFromHistory(
    data.history.map((event) => event.message)
  )
  const consultantFromSnapshot = intelligenceSnapshot?.consultantRecommendations ?? []
  const consultantFromDiagnostics =
    intelligenceSnapshot?.diagnostics?.consultantRecommendations ?? []

  const consultantRecs =
    consultantFromSnapshot.length > 0 ? consultantFromSnapshot : consultantFromDiagnostics

  if (consultantRecs.length > 0) {
    return consultantRecs.slice(0, 8).map(consultantToUiRecommendation)
  }

  return buildLegacyRecommendationsFromPersistedFindings(data, intelligenceSnapshot)
}

/**
 * Legacy path — only used when persisted audits lack V5 consultantRecommendations
 * in the intelligence snapshot. Reconstructs groups from finding titles because
 * audit_findings rows do not store ruleId. Do not extend this path; new audits
 * must always persist consultantRecommendations with ruleId metadata.
 */
function buildLegacyRecommendationsFromPersistedFindings(
  data: AuditSessionData,
  intelligenceSnapshot: ReturnType<typeof parseIntelligenceSnapshotFromHistory>
): Recommendation[] {
  const websiteIntent =
    intelligenceSnapshot?.websiteIntent?.websiteIntent ??
    detectWebsiteIntent({
      session: data.session,
      pages: data.pages,
      pageSnapshots: [],
    }).websiteIntent

  const ruleTitleByNormalizedTitle = new Map(
    RULE_METADATA.map((rule) => [rule.title.trim().toLowerCase(), rule.id])
  )

  type RecommendationGroup = {
    title: string
    summary: string
    severity: FindingSeverity
    category: string
    affectedPages: string[]
    findingIds: string[]
    evidenceCount: number
    ruleId?: string
  }

  const groups = new Map<string, RecommendationGroup>()

  for (const finding of data.findings) {
    const ruleId =
      finding.ruleId ??
      ruleTitleByNormalizedTitle.get(finding.title.trim().toLowerCase())
    if (ruleId && !isRuleApplicableToWebsiteIntent(ruleId, websiteIntent)) {
      continue
    }

    const key = finding.title.trim().toLowerCase()
    const pagePath = finding.pageId
      ? data.pages.find((page) => page.id === finding.pageId)?.path
      : undefined
    const existing = groups.get(key)

    if (existing) {
      existing.findingIds.push(finding.id)
      existing.evidenceCount += 1
      if (pagePath && !existing.affectedPages.includes(pagePath)) {
        existing.affectedPages.push(pagePath)
      }
      if (!existing.ruleId && ruleId) {
        existing.ruleId = ruleId
      }
      if (severityRank(finding.severity) < severityRank(existing.severity)) {
        existing.severity = finding.severity
      }
      continue
    }

    groups.set(key, {
      title: finding.title,
      summary: finding.recommendation,
      severity: finding.severity,
      category: CATEGORY_LABELS[finding.category],
      affectedPages: pagePath ? [pagePath] : [],
      findingIds: [finding.id],
      evidenceCount: 1,
      ruleId,
    })
  }

  return [...groups.values()]
    .sort((a, b) => {
      const severityDelta = severityRank(a.severity) - severityRank(b.severity)
      if (severityDelta !== 0) return severityDelta
      return b.evidenceCount - a.evidenceCount
    })
    .slice(0, 8)
    .map((group, index) => ({
      id: `rec-${group.findingIds[0]}`,
      ruleId: group.ruleId,
      title: group.title,
      summary: group.summary,
      priority: priorityFromSeverity(group.severity, index),
      estimatedLift: liftLabelForSeverity(group.severity),
      category: group.category,
      affectedPages: group.affectedPages,
      affectedCount: group.affectedPages.length || group.evidenceCount,
      evidenceCount: group.evidenceCount,
    }))
}

function liftLabelForSeverity(severity: FindingSeverity): string {
  if (severity === "critical" || severity === "high") return "High-impact improvement"
  if (severity === "medium") return "Moderate-impact improvement"
  return "Incremental improvement"
}

function mapHistoryToTimeline(data: AuditSessionData): TimelineEvent[] {
  const publicHistory = data.history.filter(
    (event) => !isInternalHistoryMessage(event.message)
  )

  return publicHistory.map((event, index, events) => ({
    id: event.id,
    label: event.message,
    timestamp: formatAuditDateTime(event.createdAt),
    status:
      index === events.length - 1 && isAuditInProgress(event.status)
        ? "in_progress"
        : event.status === "failed"
          ? "pending"
          : "completed",
    kind: classifyTimelineMessage(event.message),
    detail:
      event.message.startsWith("Analyzed ")
        ? event.message.replace(/^Analyzed /, "")
        : undefined,
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
      topImpacts: buildTopImpacts(findingsForScoreCategory(data.findings, category)),
    }
  })
}

export function buildAuditDetailFromSession(data: AuditSessionData): AuditDetail {
  const { session } = data
  const domain = parseDomainFromUrl(session.websiteUrl)
  const createdAt = formatAuditDateTime(session.createdAt)
  const completedAtDate =
    session.status === "completed" || session.status === "failed"
      ? formatAuditDateTime(session.updatedAt)
      : undefined
  const duration =
    session.status === "completed" || session.status === "failed"
      ? formatAuditDuration(session.createdAt, session.updatedAt) ?? undefined
      : undefined
  const growthScore = resolveGrowthScore(data)
  const inProgress = isAuditInProgress(session.status)
  const stats = buildRunStats(data)
  const runMetadata = buildRunMetadata(data)

  return {
    id: session.id,
    name: buildAuditName(domain),
    domain,
    websiteUrl: session.websiteUrl,
    createdAt,
    completedAtDate,
    completedAt: completedAtDate ?? createdAt,
    duration,
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
    timeline:
      data.history.some((event) => !isInternalHistoryMessage(event.message))
        ? mapHistoryToTimeline(data)
        : [],
    stats: inProgress
      ? {
          totalFindings: 0,
          pageFindingsCount: 0,
          siteFindingsCount: 0,
          totalRecommendations: 0,
        }
      : stats,
    runMetadata: inProgress
      ? {
          pagesDiscovered: data.pages.length,
          pagesReachable: 0,
          pagesUnreachable: 0,
          pagesAnalyzed: 0,
          findingsCount: 0,
          siteFindingsCount: 0,
          pageFindingsCount: 0,
          ruleCount: RULE_METADATA.length,
          auditEngineVersion: SCORING_ENGINE_VERSION,
        }
      : runMetadata,
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
    completedAt: formatAuditDateTime(session.updatedAt),
    pagesScanned: pageCount,
    conversionScore: resolveGrowthScoreFromScores(scores),
    status: session.status,
  }
}
