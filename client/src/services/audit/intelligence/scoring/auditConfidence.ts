import type { PageContentSnapshot } from "@/services/audit/pageContentService"
import type { AuditPage } from "@/types/auditEngine"
import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"

export type AuditConfidenceInput = {
  pages: AuditPage[]
  analyzedPageIds: Set<string>
  pageSnapshots: PageContentSnapshot[]
  findings: IntelligenceFindingDraft[]
  applicableRuleCount: number
  executedRuleCount: number
}

export type AuditConfidenceResult = {
  /** 0–100 composite confidence in audit completeness and finding quality */
  score: number
  label: string
  components: {
    crawlCompleteness: number
    renderSuccess: number
    ruleCoverage: number
    findingConfidence: number
  }
}

const COMPONENT_WEIGHTS = {
  crawlCompleteness: 0.3,
  renderSuccess: 0.25,
  ruleCoverage: 0.25,
  findingConfidence: 0.2,
} as const

function clampConfidence(value: number): number {
  return Math.round(Math.min(98, Math.max(40, value)))
}

function confidenceLabel(score: number): string {
  if (score >= 88) return "High confidence"
  if (score >= 72) return "Moderate confidence"
  if (score >= 55) return "Limited confidence"
  return "Low confidence"
}

/**
 * Estimates how complete and reliable an audit run is.
 *
 * Factors:
 * - Crawl completeness (analyzed vs discovered pages)
 * - Render / fetch success rate
 * - Rule coverage (executed vs applicable rules)
 * - Mean detector confidence across findings (or baseline when clean)
 */
export function calculateAuditConfidence(input: AuditConfidenceInput): AuditConfidenceResult {
  const discovered = Math.max(1, input.pages.length)
  const analyzed = input.analyzedPageIds.size
  const crawlCompleteness = (analyzed / discovered) * 100

  const snapshotsWithFetch = input.pageSnapshots.filter((snapshot) => snapshot.fetchSucceeded)
  const renderSuccess =
    snapshotsWithFetch.length === 0
      ? 50
      : (snapshotsWithFetch.filter((s) => s.document).length / snapshotsWithFetch.length) * 100

  const ruleCoverage =
    input.applicableRuleCount === 0
      ? 85
      : Math.min(100, (input.executedRuleCount / input.applicableRuleCount) * 100)

  const findingConfidence =
    input.findings.length === 0
      ? 88
      : input.findings.reduce((sum, finding) => sum + finding.confidence, 0) / input.findings.length

  const score = clampConfidence(
    crawlCompleteness * COMPONENT_WEIGHTS.crawlCompleteness +
      renderSuccess * COMPONENT_WEIGHTS.renderSuccess +
      ruleCoverage * COMPONENT_WEIGHTS.ruleCoverage +
      findingConfidence * COMPONENT_WEIGHTS.findingConfidence
  )

  return {
    score,
    label: confidenceLabel(score),
    components: {
      crawlCompleteness: Math.round(crawlCompleteness),
      renderSuccess: Math.round(renderSuccess),
      ruleCoverage: Math.round(ruleCoverage),
      findingConfidence: Math.round(findingConfidence),
    },
  }
}
