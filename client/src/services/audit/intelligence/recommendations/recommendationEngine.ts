import type { RuleDifficulty } from "@/services/audit/intelligence/types"
import type { IntelligenceFindingDraft, RecommendationDraft } from "@/services/audit/intelligence/types"
import { formatConfidenceLabel } from "@/services/audit/intelligence/confidence/confidenceEngine"

const DIFFICULTY_BY_SEVERITY: Record<IntelligenceFindingDraft["severity"], RuleDifficulty> = {
  critical: "medium",
  high: "medium",
  medium: "low",
  low: "low",
}

const BENEFIT_BY_IMPACT: Record<IntelligenceFindingDraft["businessImpact"], string> = {
  critical: "High conversion and revenue upside",
  high: "Meaningful improvement to conversion path",
  medium: "Moderate lift to clarity and trust",
  low: "Incremental UX polish",
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
  index: number
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
    priority: finding.severity,
    difficulty: DIFFICULTY_BY_SEVERITY[finding.severity],
    recommendation: finding.recommendation,
    expectedBenefit: `${BENEFIT_BY_IMPACT[finding.businessImpact]} (${formatConfidenceLabel(finding.confidence)} confidence)`,
    implementationSteps: buildImplementationSteps(finding),
    confidence: finding.confidence,
    pageId: finding.pageId,
    category: finding.category,
  }
}

export function buildRecommendations(
  findings: IntelligenceFindingDraft[]
): RecommendationDraft[] {
  const severityRank = { critical: 0, high: 1, medium: 2, low: 3 }

  return [...findings]
    .sort((a, b) => {
      const severityDelta = severityRank[a.severity] - severityRank[b.severity]
      if (severityDelta !== 0) return severityDelta
      return b.confidence - a.confidence
    })
    .map((finding, index) => buildRecommendationFromFinding(finding, index))
}

export function toLegacyRecommendationText(draft: RecommendationDraft): string {
  return draft.recommendation
}
