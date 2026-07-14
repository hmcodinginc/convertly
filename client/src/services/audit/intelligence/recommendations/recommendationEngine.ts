import type { RuleDifficulty } from "@/services/audit/intelligence/types"
import type { IntelligenceFindingDraft, RecommendationDraft } from "@/services/audit/intelligence/types"
import { formatConfidenceLabel } from "@/services/audit/intelligence/confidence/confidenceEngine"
import { consolidateConsultantRecommendations } from "@/services/audit/intelligence/recommendations/consultantRecommendation"
import type { WebsiteIntent } from "@/services/audit/intelligence/websiteIntentTypes"

const DIFFICULTY_BY_SEVERITY: Record<IntelligenceFindingDraft["severity"], RuleDifficulty> = {
  critical: "medium",
  high: "medium",
  medium: "low",
  low: "low",
}

function buildImplementationSteps(finding: IntelligenceFindingDraft): string[] {
  return [
    `Review the affected page${finding.pageId ? "" : "s"} and confirm the issue in context.`,
    finding.recommendation,
    "Re-run an audit after publishing to verify the improvement.",
  ]
}

export function buildRecommendationFromFinding(
  finding: IntelligenceFindingDraft,
  index: number,
  businessImpactLabel: string
): RecommendationDraft {
  const evidenceSummary =
    finding.evidence.length > 0
      ? finding.evidence.map((item) => `${item.label}: ${item.value}`).join(" · ")
      : finding.description

  return {
    id: `rec-${finding.ruleId}-${finding.pageId ?? "site"}-${index}`,
    ruleId: finding.ruleId,
    findingTitle: finding.title,
    problem: finding.title,
    evidence: evidenceSummary,
    businessImpact: finding.businessImpact,
    businessImpactLabel,
    priority: finding.severity,
    difficulty: DIFFICULTY_BY_SEVERITY[finding.severity],
    recommendation: finding.recommendation,
    expectedBenefit: `${businessImpactLabel} (${formatConfidenceLabel(finding.confidence)} confidence)`,
    implementationSteps: buildImplementationSteps(finding),
    confidence: finding.confidence,
    pageId: finding.pageId,
    category: finding.category,
  }
}

/**
 * Intent-aware recommendations — delegates to consultant consolidation.
 */
export function buildRecommendations(
  findings: IntelligenceFindingDraft[],
  pagePathById: Map<string, string> = new Map(),
  websiteIntent: WebsiteIntent = "unknown"
): RecommendationDraft[] {
  const consultantRecs = consolidateConsultantRecommendations(
    findings,
    pagePathById,
    websiteIntent
  )

  return consultantRecs.map((rec, index) => {
    const representativeFinding = findings.find((finding) => finding.ruleId === rec.ruleId)
    if (!representativeFinding) {
      throw new Error(`Missing representative finding for rule ${rec.ruleId}`)
    }

    return buildRecommendationFromFinding(representativeFinding, index, rec.businessImpactLabel)
  })
}
