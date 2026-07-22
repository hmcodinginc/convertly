import type { PageContentSnapshot } from "@/services/audit/pageContentService"
import type { AuditPage } from "@/types/auditEngine"
import { getSnapshotMetrics } from "@/services/audit/rules/snapshotMetrics"
import { RENDER_SENSITIVE_UNVERIFIED_THRESHOLD } from "@/services/audit/intelligence/rendering/renderReliability"

export type AuditConfidenceSignal = {
  id: string
  label: string
  /** 0–100 contribution weight within its group */
  score: number
  weight: number
  detail: string
}

export type AuditConfidenceResult = {
  confidenceScore: number
  label: string
  tier: "High" | "Medium" | "Low"
  manualVerificationRecommended: boolean
  confidenceReasons: string[]
  confidenceWarnings: string[]
  signals: AuditConfidenceSignal[]
  components: {
    crawlCompleteness: number
    renderQuality: number
    domExtraction: number
    metadataCompleteness: number
    analysisDepth: number
    ruleCoverage: number
  }
}

const SIGNAL_WEIGHTS = {
  crawlCompleteness: 0.18,
  renderQuality: 0.22,
  domExtraction: 0.15,
  metadataCompleteness: 0.08,
  analysisDepth: 0.17,
  ruleCoverage: 0.12,
  renderConfidence: 0.08,
} as const

function clampConfidence(value: number): number {
  return Math.round(Math.min(98, Math.max(25, value)))
}

function confidenceTier(score: number): "High" | "Medium" | "Low" {
  if (score >= 80) return "High"
  if (score >= 60) return "Medium"
  return "Low"
}

function confidenceLabel(tier: "High" | "Medium" | "Low"): string {
  return `${tier} confidence`
}

/**
 * Audit confidence from measurable crawl, render, and analysis signals.
 * Poor DOM quality reduces confidence — it does not directly reduce scores.
 */
export function calculateAuditConfidenceFromSignals(input: {
  pages: AuditPage[]
  pageSnapshots: PageContentSnapshot[]
  analyzedPageIds: Set<string>
  applicableRuleCount: number
  executedRuleCount: number
  skippedPageCount: number
  renderConfidenceScore?: number
  blockedPageCount?: number
  crawlFailureCount?: number
  renderSensitiveUnverifiedRatio?: number
  highRiskPlatform?: boolean
}): AuditConfidenceResult {
  const discovered = Math.max(1, input.pages.length)
  const fetchSucceeded = input.pageSnapshots.filter((snapshot) => snapshot.fetchSucceeded)
  const crawlCompleteness = (fetchSucceeded.length / discovered) * 100

  const rendered = fetchSucceeded.filter((snapshot) => snapshot.contentSource === "rendered")
  const hydrationOk = rendered.filter(
    (snapshot) => snapshot.renderDiagnostics?.hydrationSettled === true
  ).length
  const renderQuality =
    fetchSucceeded.length === 0
      ? 40
      : ((rendered.length * 0.6 + hydrationOk * 0.4) / fetchSucceeded.length) * 100

  const domExtraction =
    fetchSucceeded.length === 0
      ? 40
      : (fetchSucceeded.filter((snapshot) => Boolean(snapshot.document)).length /
          fetchSucceeded.length) *
        100

  let metadataScoreSum = 0
  for (const snapshot of fetchSucceeded) {
    if (!snapshot.document) continue
    const metrics = getSnapshotMetrics(snapshot)
    let pageMeta = 0
    if (metrics.documentTitle) pageMeta += 40
    if (snapshot.document.querySelector('meta[name="description" i]')) pageMeta += 35
    if (metrics.firstH1) pageMeta += 25
    metadataScoreSum += pageMeta
  }
  const metadataCompleteness =
    fetchSucceeded.length === 0 ? 40 : metadataScoreSum / fetchSucceeded.length

  const analysisDepth =
    fetchSucceeded.length === 0
      ? 40
      : (input.analyzedPageIds.size / fetchSucceeded.length) * 100

  const ruleCoverage =
    input.applicableRuleCount === 0
      ? 85
      : Math.min(100, (input.executedRuleCount / input.applicableRuleCount) * 100)

  // Screenshot capture is not implemented; render quality stands on its own
  // rather than being blended with a fabricated screenshot success signal.
  const renderConfidenceComponent = (input.renderConfidenceScore ?? 0.75) * 100

  const confidenceScore = clampConfidence(
    crawlCompleteness * SIGNAL_WEIGHTS.crawlCompleteness +
      renderQuality * SIGNAL_WEIGHTS.renderQuality +
      domExtraction * SIGNAL_WEIGHTS.domExtraction +
      metadataCompleteness * SIGNAL_WEIGHTS.metadataCompleteness +
      analysisDepth * SIGNAL_WEIGHTS.analysisDepth +
      ruleCoverage * SIGNAL_WEIGHTS.ruleCoverage +
      renderConfidenceComponent * SIGNAL_WEIGHTS.renderConfidence
  )

  let adjustedScore = confidenceScore
  const unverifiedRatio = input.renderSensitiveUnverifiedRatio ?? 0

  if (unverifiedRatio > RENDER_SENSITIVE_UNVERIFIED_THRESHOLD) {
    const penalty = Math.round((unverifiedRatio - RENDER_SENSITIVE_UNVERIFIED_THRESHOLD) * 80)
    adjustedScore = clampConfidence(adjustedScore - penalty)
  }

  if (input.highRiskPlatform && (input.renderConfidenceScore ?? 1) < 0.85) {
    adjustedScore = clampConfidence(Math.min(adjustedScore, 62))
  }

  const tier = confidenceTier(adjustedScore)
  const manualVerificationRecommended =
    tier === "Low" ||
    (input.renderConfidenceScore ?? 1) < 0.85 ||
    unverifiedRatio > RENDER_SENSITIVE_UNVERIFIED_THRESHOLD

  const reasons: string[] = []
  const warnings: string[] = []

  if (crawlCompleteness >= 95) reasons.push(`${fetchSucceeded.length}/${discovered} pages fetched successfully`)
  else warnings.push(`Only ${fetchSucceeded.length}/${discovered} pages fetched`)

  if (renderQuality >= 80) reasons.push("JavaScript rendering succeeded on most analyzed pages")
  else if (rendered.length === 0) warnings.push("No pages were browser-rendered — SPA content may be incomplete")

  if ((input.renderConfidenceScore ?? 1) >= 0.85) {
    reasons.push("Rendered DOM is trustworthy for UX and conversion rules")
  } else {
    warnings.push("Some findings may require manual verification due to incomplete rendering")
  }

  if (domExtraction >= 90) reasons.push("DOM extraction succeeded across fetched pages")
  else warnings.push("Some pages could not be parsed into analyzable DOM")

  if (analysisDepth >= 90) reasons.push("Rules executed on nearly all fetched pages")
  else warnings.push(`${input.skippedPageCount} pages skipped analysis gate`)

  if (input.blockedPageCount && input.blockedPageCount > 0) {
    warnings.push(`${input.blockedPageCount} pages blocked during crawl`)
  }

  if (input.crawlFailureCount && input.crawlFailureCount > 0) {
    warnings.push(`${input.crawlFailureCount} crawl fetch failures`)
  }

  if (unverifiedRatio > RENDER_SENSITIVE_UNVERIFIED_THRESHOLD) {
    warnings.push(
      `${Math.round(unverifiedRatio * 100)}% of DOM-dependent checks could not be verified — audit confidence reduced (growth score unchanged)`
    )
  }

  if (input.highRiskPlatform) {
    warnings.push(
      "Protected or search-dominant site — conversion recommendations require high render confidence"
    )
  }

  if (manualVerificationRecommended) {
    warnings.push("Some findings may require manual verification.")
  }

  const signals: AuditConfidenceSignal[] = [
    { id: "crawl", label: "Crawl completeness", score: crawlCompleteness, weight: 18, detail: `${fetchSucceeded.length}/${discovered} pages` },
    { id: "render", label: "JS render quality", score: renderQuality, weight: 22, detail: `${rendered.length} rendered, ${hydrationOk} hydrated` },
    { id: "render-confidence", label: "Render confidence", score: renderConfidenceComponent, weight: 8, detail: `DOM trust score ${Math.round(renderConfidenceComponent)}%` },
    { id: "dom", label: "DOM extraction", score: domExtraction, weight: 15, detail: "Parseable HTML documents" },
    { id: "depth", label: "Analysis depth", score: analysisDepth, weight: 17, detail: `${input.analyzedPageIds.size} pages analyzed` },
    { id: "rules", label: "Rule coverage", score: ruleCoverage, weight: 12, detail: `${input.executedRuleCount}/${input.applicableRuleCount} evaluations` },
  ]

  return {
    confidenceScore: adjustedScore,
    label: confidenceLabel(tier),
    tier,
    manualVerificationRecommended,
    confidenceReasons: reasons,
    confidenceWarnings: warnings,
    signals,
    components: {
      crawlCompleteness: Math.round(crawlCompleteness),
      renderQuality: Math.round(renderQuality),
      domExtraction: Math.round(domExtraction),
      metadataCompleteness: Math.round(metadataCompleteness),
      analysisDepth: Math.round(analysisDepth),
      ruleCoverage: Math.round(ruleCoverage),
    },
  }
}
