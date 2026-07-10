import type { Issue, IssueSeverity, PageFinding, Recommendation, SiteFinding } from "@/types/audit"

export type GroupedPageIssue = {
  key: string
  title: string
  severity: IssueSeverity
  recommendation?: string
  category?: string
  representativeImpact: string
  affectedPages: string[]
  pageLabels: string[]
  issueIds: string[]
}

export type GroupedSiteFinding = {
  key: string
  title: string
  severity: IssueSeverity
  recommendation?: string
  representativeImpact: string
  issueIds: string[]
  occurrenceCount: number
}

export type GroupedRecommendation = {
  key: string
  title: string
  summary: string
  priority: Recommendation["priority"]
  category: string
  estimatedLift: string
  affectedPages: string[]
  pageLabels: string[]
  affectedCount: number
  evidenceCount: number
  recommendationIds: string[]
  ruleId?: string
}

function resolvePageLabel(path: string, pages: PageFinding[]): string {
  const match = pages.find((page) => page.path === path)
  return match?.label ?? path
}

export function groupPageIssues(issues: Issue[], pages: PageFinding[]): GroupedPageIssue[] {
  const groups = new Map<string, GroupedPageIssue>()

  for (const issue of issues) {
    const key = `${issue.severity}::${issue.issue}`
    const existing = groups.get(key)

    if (existing) {
      existing.issueIds.push(issue.id)
      if (issue.page && !existing.affectedPages.includes(issue.page)) {
        existing.affectedPages.push(issue.page)
        existing.pageLabels.push(resolvePageLabel(issue.page, pages))
      }
      continue
    }

    groups.set(key, {
      key,
      title: issue.issue,
      severity: issue.severity,
      recommendation: issue.recommendation,
      category: issue.category,
      representativeImpact: issue.impact,
      affectedPages: issue.page ? [issue.page] : [],
      pageLabels: issue.page ? [resolvePageLabel(issue.page, pages)] : [],
      issueIds: [issue.id],
    })
  }

  return [...groups.values()]
}

export function groupSiteFindings(findings: SiteFinding[]): GroupedSiteFinding[] {
  const groups = new Map<string, GroupedSiteFinding>()

  for (const finding of findings) {
    const key = `${finding.severity}::${finding.issue}`
    const existing = groups.get(key)

    if (existing) {
      existing.issueIds.push(finding.id)
      existing.occurrenceCount += 1
      continue
    }

    groups.set(key, {
      key,
      title: finding.issue,
      severity: finding.severity,
      recommendation: finding.recommendation,
      representativeImpact: finding.impact,
      issueIds: [finding.id],
      occurrenceCount: 1,
    })
  }

  return [...groups.values()]
}

export function groupRecommendations(
  recommendations: Recommendation[],
  pages: PageFinding[]
): GroupedRecommendation[] {
  const groups = new Map<string, GroupedRecommendation>()

  for (const rec of recommendations) {
    const key = `${rec.title}::${rec.summary}`
    const existing = groups.get(key)
    const recPages = rec.affectedPages ?? []

    if (existing) {
      existing.recommendationIds.push(rec.id)
      existing.evidenceCount += rec.evidenceCount ?? 1
      if (!existing.ruleId && rec.ruleId) {
        existing.ruleId = rec.ruleId
      }
      for (const path of recPages) {
        if (!existing.affectedPages.includes(path)) {
          existing.affectedPages.push(path)
          existing.pageLabels.push(resolvePageLabel(path, pages))
        }
      }
      existing.affectedCount = existing.affectedPages.length
      continue
    }

    groups.set(key, {
      key,
      title: rec.title,
      summary: rec.summary,
      priority: rec.priority,
      category: rec.category,
      estimatedLift: rec.estimatedLift,
      affectedPages: recPages,
      pageLabels: recPages.map((path) => resolvePageLabel(path, pages)),
      affectedCount: rec.affectedCount ?? (recPages.length || 1),
      evidenceCount: rec.evidenceCount ?? 1,
      recommendationIds: [rec.id],
      ruleId: rec.ruleId,
    })
  }

  return [...groups.values()]
}
