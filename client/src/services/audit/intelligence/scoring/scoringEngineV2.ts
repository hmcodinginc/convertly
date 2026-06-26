import type { FindingSeverity } from "@/types/auditEngine"
import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"
import { getPageImportanceWeight } from "@/services/audit/intelligence/pageImportance"
import type { AuditPage, AuditPageType } from "@/types/auditEngine"
import { INTELLIGENCE_CATEGORY_WEIGHTS } from "@/services/audit/intelligence/categories"

const SEVERITY_PENALTY: Record<FindingSeverity, number> = {
  critical: 18,
  high: 12,
  medium: 7,
  low: 4,
}

const CATEGORY_BASE: Record<ScoreCategory, number> = {
  conversion: 90,
  trust: 88,
  mobile: 86,
  ux: 88,
}

const CATEGORY_WEIGHTS: Record<ScoreCategory, number> = {
  conversion: 0.35,
  trust: 0.25,
  mobile: 0.2,
  ux: 0.2,
}

const MIN_CATEGORY_SCORE = 38
const MAX_CATEGORY_SCORE = 93
const MAX_GROWTH_SCORE = 94
const MIN_PAGE_SCORE = 0
const MAX_PAGE_SCORE = 100
const PAGE_SCORE_BASE = 100

function clampPageScore(value: number): number {
  return Math.round(Math.min(MAX_PAGE_SCORE, Math.max(MIN_PAGE_SCORE, value)))
}

function clampScore(value: number, min = MIN_CATEGORY_SCORE, max = MAX_CATEGORY_SCORE): number {
  return Math.round(Math.min(max, Math.max(min, value)))
}

function weightedPenalty(finding: IntelligenceFindingDraft, pages: AuditPage[]): number {
  const basePenalty = SEVERITY_PENALTY[finding.severity] * finding.weight
  const categoryMultiplier = INTELLIGENCE_CATEGORY_WEIGHTS[finding.category] ?? 0.7
  const confidenceMultiplier = 0.75 + finding.confidence / 400

  if (finding.scope === "site" || !finding.pageId) {
    return basePenalty * categoryMultiplier * confidenceMultiplier
  }

  const page = pages.find((item) => item.id === finding.pageId)
  const pageWeight = page
    ? getPageImportanceWeight(page.pageType, page.path)
    : getPageImportanceWeight("custom" as AuditPageType, "/")

  return basePenalty * categoryMultiplier * confidenceMultiplier * pageWeight
}

export function calculateCategoryScoresV2(
  findings: IntelligenceFindingDraft[],
  pages: AuditPage[]
): Record<ScoreCategory, number> {
  const categories: ScoreCategory[] = ["conversion", "trust", "mobile", "ux"]
  const scores = {} as Record<ScoreCategory, number>

  for (const category of categories) {
    const categoryFindings = findings.filter((finding) => finding.scoreCategory === category)
    const penalty = categoryFindings.reduce(
      (total, finding) => total + weightedPenalty(finding, pages),
      0
    )
    scores[category] = clampScore(CATEGORY_BASE[category] - penalty)
  }

  return scores
}

export function calculateGrowthScoreV2(
  categoryScores: Record<ScoreCategory, number>
): number {
  const weighted =
    categoryScores.conversion * CATEGORY_WEIGHTS.conversion +
    categoryScores.trust * CATEGORY_WEIGHTS.trust +
    categoryScores.mobile * CATEGORY_WEIGHTS.mobile +
    categoryScores.ux * CATEGORY_WEIGHTS.ux

  return clampScore(weighted, MIN_CATEGORY_SCORE, MAX_GROWTH_SCORE)
}

export function calculatePageScore(
  page: AuditPage,
  findings: IntelligenceFindingDraft[],
  options?: { analyzed?: boolean }
): number {
  if (options?.analyzed === false) {
    return 0
  }

  const pageFindings = findings.filter((finding) => finding.pageId === page.id)
  const penalty = pageFindings.reduce(
    (total, finding) => total + SEVERITY_PENALTY[finding.severity] * finding.weight,
    0
  )

  return clampPageScore(PAGE_SCORE_BASE - penalty)
}

export function calculatePageScoreFromAuditFindings(
  page: AuditPage,
  findings: Array<{ pageId?: string; severity: FindingSeverity }>,
  options?: { analyzed?: boolean }
): number {
  if (options?.analyzed === false) {
    return 0
  }

  const pageFindings = findings.filter((finding) => finding.pageId === page.id)
  const penalty = pageFindings.reduce(
    (total, finding) => total + SEVERITY_PENALTY[finding.severity],
    0
  )

  return clampPageScore(PAGE_SCORE_BASE - penalty)
}

export function calculateAllPageScores(
  pages: AuditPage[],
  findings: IntelligenceFindingDraft[],
  analyzedPageIds?: Set<string>
): Record<string, number> {
  const scores: Record<string, number> = {}

  for (const page of pages) {
    const analyzed = analyzedPageIds ? analyzedPageIds.has(page.id) : true
    scores[page.id] = calculatePageScore(page, findings, { analyzed })
  }

  return scores
}

export function calculateAuditScoreV2(
  findings: IntelligenceFindingDraft[],
  pages: AuditPage[],
  analyzedPageIds?: Set<string>
): {
  categories: Record<ScoreCategory, number>
  growthScore: number
  pageScores: Record<string, number>
} {
  const categories = calculateCategoryScoresV2(findings, pages)
  const growthScore = calculateGrowthScoreV2(categories)
  const pageScores = calculateAllPageScores(pages, findings, analyzedPageIds)

  return { categories, growthScore, pageScores }
}

/** Backward-compatible bridge for legacy ScoredFindingInput consumers */
export type ScoredFindingBridge = {
  ruleId: string
  scoreCategory: ScoreCategory
  severity: FindingSeverity
  category: IntelligenceFindingDraft["legacyCategory"]
  title: string
  description: string
  recommendation: string
  pageId?: string
}

export function intelligenceFindingToScoredInput(
  finding: IntelligenceFindingDraft
): ScoredFindingBridge {
  return {
    ruleId: finding.ruleId,
    scoreCategory: finding.scoreCategory,
    severity: finding.severity,
    category: finding.legacyCategory,
    title: finding.title,
    description: finding.description,
    recommendation: finding.recommendation,
    pageId: finding.pageId,
  }
}
