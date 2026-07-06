import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"
import type { WebsiteIntent } from "@/services/audit/intelligence/websiteIntentTypes"

export const VIEWPORT_RULE_ID = "tech-missing-viewport"

/**
 * Platform / non-marketing intents where viewport meta alone must never
 * participate in Tier-0 Growth Score ceilings.
 */
export const VIEWPORT_CEILING_EXCLUDED_INTENTS: readonly WebsiteIntent[] = [
  "search_engine",
  "marketplace",
  "developer_platform",
  "open_source",
  "dashboard",
] as const

/**
 * Existing mobile outcome rules — primary evidence that mobile UX actually fails.
 * Viewport meta is secondary evidence only.
 */
export const MOBILE_BEHAVIORAL_OUTCOME_RULE_IDS = new Set([
  "tech-horizontal-overflow",
  "a11y-small-touch-targets",
  "a11y-small-font-sizes",
  "tech-oversized-images",
])

export const VIEWPORT_BEST_PRACTICE_EXPLANATION =
  "Viewport recommendation recorded as technical best practice. No measurable mobile usability failures detected."

function isScorableFinding(finding: IntelligenceFindingDraft): boolean {
  return !finding.excludeFromScoring
}

/**
 * True when the page (or site) has a confirmed mobile behavioral failure finding.
 */
export function hasMobileBehavioralFailure(
  viewportFinding: IntelligenceFindingDraft,
  allFindings: IntelligenceFindingDraft[]
): boolean {
  return allFindings.some((finding) => {
    if (!isScorableFinding(finding)) return false
    if (!MOBILE_BEHAVIORAL_OUTCOME_RULE_IDS.has(finding.ruleId)) return false
    if (viewportFinding.pageId) {
      return finding.pageId === viewportFinding.pageId
    }
    return true
  })
}

/**
 * Whether a tech-missing-viewport finding may participate in blocker ceilings.
 *
 * Primary evidence: mobile behavioral outcomes.
 * Secondary evidence: missing viewport declaration.
 * Platform intents: never ceiling from viewport.
 */
export function isViewportFindingEligibleForBlockerCeiling(
  finding: IntelligenceFindingDraft,
  allFindings: IntelligenceFindingDraft[],
  websiteIntent: WebsiteIntent
): boolean {
  if (finding.ruleId !== VIEWPORT_RULE_ID) return true
  if (!isScorableFinding(finding)) return false

  if (VIEWPORT_CEILING_EXCLUDED_INTENTS.includes(websiteIntent)) {
    return false
  }

  return hasMobileBehavioralFailure(finding, allFindings)
}

/**
 * True when viewport findings exist but did not participate in the Growth Score ceiling.
 */
export function shouldExplainViewportAsBestPractice(
  findings: IntelligenceFindingDraft[],
  appliedBlockers: Array<{ ruleId: string }>
): boolean {
  const hasViewportFinding = findings.some(
    (finding) => finding.ruleId === VIEWPORT_RULE_ID && isScorableFinding(finding)
  )
  const viewportInCeiling = appliedBlockers.some(
    (blocker) => blocker.ruleId === VIEWPORT_RULE_ID
  )
  return hasViewportFinding && !viewportInCeiling
}

/**
 * Marks viewport findings as technical best practice when they do not cap Growth Score.
 * Does not alter penalties — scoring already applied category deductions.
 */
export function annotateViewportBestPracticeFindings(
  findings: IntelligenceFindingDraft[],
  appliedBlockers: Array<{ ruleId: string }>
): IntelligenceFindingDraft[] {
  if (!shouldExplainViewportAsBestPractice(findings, appliedBlockers)) {
    return findings
  }

  return findings.map((finding) => {
    if (finding.ruleId !== VIEWPORT_RULE_ID || !isScorableFinding(finding)) {
      return finding
    }

    const tags = finding.tags.includes("technical-best-practice")
      ? finding.tags
      : [...finding.tags, "technical-best-practice"]

    return {
      ...finding,
      technicalBestPractice: true,
      tags,
      evidence: [
        ...finding.evidence,
        {
          label: "Classification",
          value: "Technical best practice — secondary evidence only",
        },
      ],
    }
  })
}
