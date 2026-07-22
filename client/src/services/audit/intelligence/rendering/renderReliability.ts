import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"
import type { RuleExecutionSummary } from "@/services/audit/intelligence/execution/ruleExecutionTracker"
import type { PageRenderConfidence, SiteRenderConfidence } from "@/services/audit/intelligence/rendering/renderConfidence"
import { RENDER_CONFIDENCE_UX_THRESHOLD } from "@/services/audit/intelligence/rendering/renderConfidence"
import {
  isConversionDomRule,
  isDomDependentRule,
  isFormDetectionRule,
  isRenderSensitiveRule,
} from "@/services/audit/intelligence/rendering/renderSensitiveRules"
import type { WebsiteIntent } from "@/services/audit/intelligence/websiteIntentTypes"
import { PLATFORM_WEBSITE_INTENTS } from "@/services/audit/intelligence/websiteIntentTypes"
import { getRuleMetadata } from "@/services/audit/intelligence/rules/ruleMetadata"

export type FindingVerificationStatus = "confirmed" | "needs_manual_verification"

/** Distinguishes a verified issue from an unverifiable detection */
export type DetectionOutcome = "confirmed_issue" | "could_not_verify"

export type RenderReliabilityContext = {
  siteRenderConfidence: SiteRenderConfidence
  websiteIntent: WebsiteIntent
  websiteUrl: string
  highRiskPlatform: boolean
}

export const RENDER_SENSITIVE_UNVERIFIED_THRESHOLD = 0.4

const PROTECTED_HOST_PATTERNS = [
  /(^|\.)google\.(com|co\.\w+)$/i,
  /(^|\.)bing\.com$/i,
  /(^|\.)duckduckgo\.com$/i,
  /(^|\.)cloudflare\.com$/i,
]

const COULD_NOT_VERIFY_TITLE_PREFIX = "Could not verify: "
const MANUAL_VERIFICATION_LABEL = "Needs manual verification"

function extractHostname(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.toLowerCase()
  } catch {
    return url.toLowerCase()
  }
}

export function isHighRiskUnreliablePlatform(url: string, renderConfidence: SiteRenderConfidence): boolean {
  const hostname = extractHostname(url)
  if (PROTECTED_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) {
    return true
  }
  if (renderConfidence.signals.includes("cloudflare-challenge")) {
    return true
  }
  if (renderConfidence.signals.includes("js-bootstrap-shell")) {
    return true
  }
  if (renderConfidence.level === "very_low" || renderConfidence.level === "low") {
    return true
  }
  return false
}

export function buildRenderReliabilityContext(input: {
  websiteUrl: string
  websiteIntent: WebsiteIntent
  siteRenderConfidence: SiteRenderConfidence
}): RenderReliabilityContext {
  return {
    siteRenderConfidence: input.siteRenderConfidence,
    websiteIntent: input.websiteIntent,
    websiteUrl: input.websiteUrl,
    highRiskPlatform: isHighRiskUnreliablePlatform(input.websiteUrl, input.siteRenderConfidence),
  }
}

function pageRenderScore(
  finding: IntelligenceFindingDraft,
  pageConfidence: Record<string, PageRenderConfidence>,
  siteScore: number
): number {
  if (!finding.pageId) return siteScore
  return pageConfidence[finding.pageId]?.score ?? siteScore
}

function buildVerificationReason(
  pageScore: number,
  signals: string[],
  highRiskPlatform: boolean
): string {
  if (signals.includes("cloudflare-challenge")) {
    return "Cloudflare challenge page detected — DOM content could not be verified"
  }
  if (highRiskPlatform && pageScore < RENDER_CONFIDENCE_UX_THRESHOLD) {
    return "Protected or search-dominant site — conversion and DOM checks require manual verification"
  }
  if (pageScore < 0.4) {
    return "Rendered DOM is not trustworthy (very low render confidence)"
  }
  if (signals.includes("js-bootstrap-shell") || signals.includes("scripts-dominate-page")) {
    return "Page appears to be a JavaScript shell — complete DOM could not be verified"
  }
  return "Rendered DOM may be incomplete (render confidence below verification threshold)"
}

function shouldSuppressRecommendation(
  finding: IntelligenceFindingDraft,
  context: RenderReliabilityContext,
  pageScore: number
): boolean {
  if (finding.excludeFromScoring) return true

  const domUnreliable = pageScore < RENDER_CONFIDENCE_UX_THRESHOLD

  if (domUnreliable && (isDomDependentRule(finding.ruleId) || isConversionDomRule(finding.ruleId))) {
    return true
  }

  if (context.highRiskPlatform && isConversionDomRule(finding.ruleId)) {
    return true
  }

  if (PLATFORM_WEBSITE_INTENTS.includes(context.websiteIntent) && isConversionDomRule(finding.ruleId)) {
    return true
  }

  if (
    !context.siteRenderConfidence.trustworthyForUxRules &&
    isConversionDomRule(finding.ruleId)
  ) {
    return true
  }

  return false
}

/**
 * Applies render reliability to findings:
 * - Confirmed issues only when DOM is trustworthy
 * - Could-not-verify state never scores or recommends
 */
export function applyRenderReliabilityToFindings(
  findings: IntelligenceFindingDraft[],
  context: RenderReliabilityContext
): IntelligenceFindingDraft[] {
  const { pageConfidence, score: siteScore, signals } = context.siteRenderConfidence

  return findings.map((finding) => {
    const pageScore = pageRenderScore(finding, pageConfidence, siteScore)
    const pageSignals = finding.pageId
      ? pageConfidence[finding.pageId]?.signals ?? signals
      : signals
    const lowConfidenceForm =
      isFormDetectionRule(finding.ruleId) && finding.confidence > 0 && finding.confidence < 65
    const renderSensitive = isRenderSensitiveRule(finding.ruleId)

    if (!renderSensitive && !lowConfidenceForm) {
      return {
        ...finding,
        verificationStatus: "confirmed" as const,
        detectionOutcome: "confirmed_issue" as const,
        excludeFromScoring: false,
        suppressRecommendation: false,
      }
    }

    const suppressRec =
      lowConfidenceForm || shouldSuppressRecommendation(finding, context, pageScore)

    if (
      !lowConfidenceForm &&
      pageScore >= RENDER_CONFIDENCE_UX_THRESHOLD &&
      !suppressRec
    ) {
      return {
        ...finding,
        verificationStatus: "confirmed" as const,
        detectionOutcome: "confirmed_issue" as const,
        excludeFromScoring: false,
        suppressRecommendation: false,
        verificationReason: undefined,
      }
    }

    const reason = lowConfidenceForm
      ? "Authentication UI appears JavaScript- or OAuth-based — a standard HTML form was not confidently detected"
      : buildVerificationReason(pageScore, pageSignals, context.highRiskPlatform)
    const meta = getRuleMetadata(finding.ruleId)
    const baseTitle = meta?.title ?? finding.title
    const formSoftened = isFormDetectionRule(finding.ruleId)
    const softenedTitle = formSoftened
      ? baseTitle.replace(/^Missing /i, "").replace(/^No /i, "")
      : baseTitle
    const title = finding.title.startsWith(COULD_NOT_VERIFY_TITLE_PREFIX)
      ? finding.title
      : formSoftened
        ? `${softenedTitle} could not be confidently detected`
        : `${COULD_NOT_VERIFY_TITLE_PREFIX}${baseTitle}`
    const description = formSoftened
      ? `${MANUAL_VERIFICATION_LABEL}. This page appears to rely on JavaScript or a custom/OAuth login flow — a standard HTML form was not verified. ${reason}. A reachable page does not guarantee a detectable HTML form.`
      : `${MANUAL_VERIFICATION_LABEL}. This is not a confirmed issue — the engine could not verify the DOM. ${reason}.`

    return {
      ...finding,
      verificationStatus: "needs_manual_verification" as const,
      detectionOutcome: "could_not_verify" as const,
      excludeFromScoring: true,
      suppressRecommendation: true,
      confidence: Math.min(finding.confidence, Math.round(pageScore * 100)),
      title,
      verificationReason: reason,
      description,
      recommendation: suppressRec
        ? `${MANUAL_VERIFICATION_LABEL} — recommendation suppressed (${reason}).`
        : `${MANUAL_VERIFICATION_LABEL} — ${reason}. Verify manually before acting.`,
      evidence: [
        ...finding.evidence,
        { label: "Verification", value: reason },
        { label: "Render confidence", value: `${Math.round(pageScore * 100)}%` },
      ],
    }
  })
}

export type RenderSensitiveVerificationStats = {
  attempted: number
  skippedLowConfidence: number
  unverifiedFindings: number
  totalSlots: number
  unverifiedRatio: number
  exceedsThreshold: boolean
}

export function computeRenderSensitiveVerificationStats(
  findings: IntelligenceFindingDraft[],
  ruleExecution: RuleExecutionSummary
): RenderSensitiveVerificationStats {
  const attempted = ruleExecution.appliedRules.filter((record) =>
    isRenderSensitiveRule(record.ruleId)
  ).length

  const skippedLowConfidence = ruleExecution.skippedRules.filter(
    (record) => record.reason === "low_render_confidence" && isRenderSensitiveRule(record.ruleId)
  ).length

  const unverifiedFindings = findings.filter(
    (finding) =>
      isRenderSensitiveRule(finding.ruleId) &&
      finding.detectionOutcome === "could_not_verify"
  ).length

  const totalSlots = attempted + skippedLowConfidence
  const unverifiedTotal = unverifiedFindings + skippedLowConfidence
  const unverifiedRatio = totalSlots > 0 ? unverifiedTotal / totalSlots : 0

  return {
    attempted,
    skippedLowConfidence,
    unverifiedFindings,
    totalSlots,
    unverifiedRatio,
    exceedsThreshold: totalSlots > 0 && unverifiedRatio > RENDER_SENSITIVE_UNVERIFIED_THRESHOLD,
  }
}

export type SuppressedRecommendationExplanation = {
  ruleId: string
  title: string
  reason: string
  category: "render_unreliable" | "platform_protected" | "manual_verification" | "intent_not_applicable"
}

export type ReliabilityReport = {
  renderConfidenceScore: number
  renderConfidenceLevel: SiteRenderConfidence["level"]
  highRiskPlatform: boolean
  verificationStats: RenderSensitiveVerificationStats
  suppressedRecommendations: SuppressedRecommendationExplanation[]
  manualVerificationCount: number
  auditConfidenceImpact: "none" | "reduced"
  summary: string
}

function suppressionCategory(
  finding: IntelligenceFindingDraft,
  context: RenderReliabilityContext
): SuppressedRecommendationExplanation["category"] {
  if (finding.detectionOutcome === "could_not_verify") return "manual_verification"
  if (context.highRiskPlatform && isConversionDomRule(finding.ruleId)) return "platform_protected"
  if (PLATFORM_WEBSITE_INTENTS.includes(context.websiteIntent) && isConversionDomRule(finding.ruleId)) {
    return "platform_protected"
  }
  return "render_unreliable"
}

export function buildReliabilityReport(input: {
  findings: IntelligenceFindingDraft[]
  ruleExecution: RuleExecutionSummary
  context: RenderReliabilityContext
  intentSuppressedRuleIds?: string[]
}): ReliabilityReport {
  const verificationStats = computeRenderSensitiveVerificationStats(
    input.findings,
    input.ruleExecution
  )

  const suppressedRecommendations: SuppressedRecommendationExplanation[] = []

  for (const finding of input.findings) {
    if (!finding.suppressRecommendation && !finding.excludeFromScoring) continue

    const meta = getRuleMetadata(finding.ruleId)
    suppressedRecommendations.push({
      ruleId: finding.ruleId,
      title: meta?.title ?? finding.title,
      reason:
        finding.verificationReason ??
        "Recommendation suppressed because DOM rendering was not reliable enough to verify this check.",
      category: suppressionCategory(finding, input.context),
    })
  }

  for (const ruleId of input.intentSuppressedRuleIds ?? []) {
    if (suppressedRecommendations.some((entry) => entry.ruleId === ruleId)) continue
    const meta = getRuleMetadata(ruleId)
    suppressedRecommendations.push({
      ruleId,
      title: meta?.title ?? ruleId,
      reason: `Not applicable for ${input.context.websiteIntent.replace(/_/g, " ")} websites.`,
      category: "intent_not_applicable",
    })
  }

  const manualVerificationCount = input.findings.filter(
    (finding) => finding.verificationStatus === "needs_manual_verification"
  ).length

  const auditConfidenceImpact = verificationStats.exceedsThreshold ? "reduced" : "none"

  let summary = `Render confidence ${Math.round(input.context.siteRenderConfidence.score * 100)}% (${input.context.siteRenderConfidence.level}).`
  if (verificationStats.exceedsThreshold) {
    summary += ` ${Math.round(verificationStats.unverifiedRatio * 100)}% of DOM-dependent checks could not be verified — audit confidence reduced, growth score unchanged.`
  }
  if (input.context.highRiskPlatform) {
    summary += " Protected or search-dominant site — conversion recommendations require high render confidence."
  }
  if (manualVerificationCount > 0) {
    summary += ` ${manualVerificationCount} finding${manualVerificationCount === 1 ? "" : "s"} marked for manual verification.`
  }

  return {
    renderConfidenceScore: input.context.siteRenderConfidence.score,
    renderConfidenceLevel: input.context.siteRenderConfidence.level,
    highRiskPlatform: input.context.highRiskPlatform,
    verificationStats,
    suppressedRecommendations,
    manualVerificationCount,
    auditConfidenceImpact,
    summary,
  }
}
