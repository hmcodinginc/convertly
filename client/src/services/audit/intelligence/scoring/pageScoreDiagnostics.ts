import type { FindingSeverity } from "@/types/auditEngine"
import type { AuditPage } from "@/types/auditEngine"
import { INTELLIGENCE_CATEGORY_WEIGHTS } from "@/services/audit/intelligence/categories"
import { getRuleMetadata } from "@/services/audit/intelligence/rules/ruleMetadata"
import { resolveRuleScoringProfile } from "@/services/audit/intelligence/rules/ruleScoringMetadata"
import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"
import {
  GROWTH_SCORE_POLICY,
  SEVERITY_PENALTY_UNITS,
} from "@/services/audit/intelligence/scoring/scoringPolicy"

export type PageFindingPenaltyLine = {
  ruleId: string
  title: string
  severity: FindingSeverity
  category: string
  rawPenalty: number
  weightedPenalty: number
  cumulativeScore: number
}

export type PageScoreBreakdown = {
  pageId: string
  path: string
  rawPenalty: number
  weightedPenalty: number
  normalizedScore: number
  finalScore: number
  findingLines: PageFindingPenaltyLine[]
}

function confidenceMultiplier(confidence: number): number {
  return 0.75 + confidence / 400
}

function familyOccurrenceKey(finding: IntelligenceFindingDraft): string {
  const meta = getRuleMetadata(finding.ruleId)
  const profile = meta ? resolveRuleScoringProfile(meta) : null
  const family = profile?.ruleFamily ?? finding.ruleId
  return `${family}:${finding.pageId ?? "site"}`
}

/**
 * Page-local penalty units — excludes site-wide importance weighting so each page
 * is scored on its own findings only.
 */
export function computePageLocalPenaltyUnits(
  finding: IntelligenceFindingDraft,
  familyOccurrences: Map<string, number>
): number {
  const meta = getRuleMetadata(finding.ruleId)
  const profile = meta ? resolveRuleScoringProfile(meta) : null

  const baseUnits = SEVERITY_PENALTY_UNITS[finding.severity]
  const influence = profile?.influenceMultiplier ?? 1
  const categoryMultiplier = INTELLIGENCE_CATEGORY_WEIGHTS[finding.category] ?? 0.7
  const confidence = confidenceMultiplier(finding.confidence)

  const familyKey = familyOccurrenceKey(finding)
  const occurrence = familyOccurrences.get(familyKey) ?? 0
  familyOccurrences.set(familyKey, occurrence + 1)
  const familyMultiplier =
    occurrence === 0 ? 1 : GROWTH_SCORE_POLICY.familyRepeatMultiplier ** occurrence

  return baseUnits * influence * categoryMultiplier * confidence * familyMultiplier
}

export function buildPageScoreBreakdown(
  page: AuditPage,
  findings: IntelligenceFindingDraft[]
): PageScoreBreakdown {
  const pageFindings = findings.filter((finding) => finding.pageId === page.id)
  const familyOccurrences = new Map<string, number>()
  const findingLines: PageFindingPenaltyLine[] = []

  let rawPenalty = 0
  let weightedPenalty = 0

  for (const finding of pageFindings) {
    const baseUnits = SEVERITY_PENALTY_UNITS[finding.severity]
    const weightedUnits = computePageLocalPenaltyUnits(finding, familyOccurrences)
    rawPenalty += baseUnits
    weightedPenalty += weightedUnits

    const dropRatio = Math.min(1, weightedPenalty / GROWTH_SCORE_POLICY.pageScoreBudget)
    const drop = dropRatio * GROWTH_SCORE_POLICY.pageScoreBase
    const cumulativeScore = Math.max(
      0,
      Math.min(GROWTH_SCORE_POLICY.maxPageScore, GROWTH_SCORE_POLICY.pageScoreBase - drop)
    )

    findingLines.push({
      ruleId: finding.ruleId,
      title: finding.title,
      severity: finding.severity,
      category: finding.category,
      rawPenalty: baseUnits,
      weightedPenalty: weightedUnits,
      cumulativeScore: Math.round(cumulativeScore),
    })
  }

  const normalizedScore =
    pageFindings.length === 0
      ? GROWTH_SCORE_POLICY.maxPageScore
      : GROWTH_SCORE_POLICY.pageScoreBase -
        Math.min(
          1,
          weightedPenalty / GROWTH_SCORE_POLICY.pageScoreBudget
        ) *
          GROWTH_SCORE_POLICY.pageScoreBase

  const finalScore = Math.round(
    Math.min(
      GROWTH_SCORE_POLICY.maxPageScore,
      Math.max(0, pageFindings.length === 0 ? GROWTH_SCORE_POLICY.maxPageScore : normalizedScore)
    )
  )

  return {
    pageId: page.id,
    path: page.path,
    rawPenalty: Math.round(rawPenalty * 100) / 100,
    weightedPenalty: Math.round(weightedPenalty * 100) / 100,
    normalizedScore: Math.round(normalizedScore),
    finalScore,
    findingLines,
  }
}

export function formatPageScoreBreakdownTable(breakdown: PageScoreBreakdown): string {
  const header = ["Page", "Raw Penalty", "Weighted Penalty", "Normalized Score", "Final Score"]
  const summaryRow = [
    breakdown.path,
    String(breakdown.rawPenalty),
    String(breakdown.weightedPenalty),
    String(breakdown.normalizedScore),
    String(breakdown.finalScore),
  ]

  const lines = [
    header.join("\t"),
    summaryRow.join("\t"),
    "",
    "Finding breakdown:",
    "Rule\tSeverity\tCategory\tRaw\tWeighted\tCumulative",
    ...breakdown.findingLines.map((line) =>
      [
        line.title,
        line.severity,
        line.category,
        String(line.rawPenalty),
        String(Math.round(line.weightedPenalty * 100) / 100),
        String(line.cumulativeScore),
      ].join("\t")
    ),
  ]

  return lines.join("\n")
}

export function buildAllPageScoreBreakdowns(
  pages: AuditPage[],
  findings: IntelligenceFindingDraft[],
  analyzedPageIds?: Set<string>
): PageScoreBreakdown[] {
  return pages
    .filter((page) => !analyzedPageIds || analyzedPageIds.has(page.id))
    .map((page) => buildPageScoreBreakdown(page, findings))
}
