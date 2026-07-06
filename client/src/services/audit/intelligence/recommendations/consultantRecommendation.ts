import type { IntelligenceCategory } from "@/services/audit/intelligence/categories"
import { INTELLIGENCE_CATEGORY_LABELS } from "@/services/audit/intelligence/categories"
import type { IntelligenceFindingDraft, RuleDifficulty } from "@/services/audit/intelligence/types"
import type { FindingSeverity } from "@/types/auditEngine"
import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import { getRuleMetadata } from "@/services/audit/intelligence/rules/ruleMetadata"
import { isRuleApplicableToWebsiteIntent } from "@/services/audit/intelligence/websiteRuleApplicability"
import type { WebsiteIntent } from "@/services/audit/intelligence/websiteIntentTypes"
import {
  CATEGORY_SCORING_POLICY_V4,
  GROWTH_SCORE_POLICY_V4,
  SEVERITY_IMPACT_WEIGHT,
} from "@/services/audit/intelligence/scoring/scoringPolicyV4"

export type BusinessImpactStatement =
  | "May reduce conversions"
  | "May reduce search visibility"
  | "May reduce trust"
  | "May hurt mobile usability"
  | "May increase bounce rate"
  | "May slow page performance"
  | "May limit accessibility"

export type ConsultantRecommendation = {
  id: string
  ruleId: string
  title: string
  severity: FindingSeverity
  whyThisMatters: string
  businessImpact: BusinessImpactStatement
  businessImpactLabel: string
  businessImpactDetail: string
  technicalExplanation: string
  evidence: string
  evidenceItems: Array<{ label: string; value: string }>
  recommendation: string
  estimatedRecovery: number
  confidence: number
  affectedPageIds: string[]
  affectedPaths: string[]
  evidenceCount: number
  relatedCategory: IntelligenceCategory
  scoreCategory: ScoreCategory
  implementationEffort: RuleDifficulty
}

const CATEGORY_WHY: Partial<Record<IntelligenceCategory, string>> = {
  conversion: "Conversion paths depend on clear calls-to-action and frictionless next steps.",
  trust: "Trust signals reduce hesitation before signup, purchase, or contact.",
  ux: "UX clarity helps visitors understand what to do and where to go next.",
  technical: "Technical foundations affect how reliably the page renders and performs.",
  accessibility: "Accessible pages work for more visitors and reduce usability friction.",
  performance: "Performance directly affects bounce rate and mobile engagement.",
  seo: "Search-oriented structure helps discovery and click-through from results.",
  forms: "Forms are high-intent conversion surfaces — gaps here cost leads.",
  cta: "CTAs anchor the primary action you want visitors to take.",
}

const CATEGORY_IMPACT: Partial<Record<IntelligenceCategory, BusinessImpactStatement>> = {
  conversion: "May reduce conversions",
  trust: "May reduce trust",
  ux: "May increase bounce rate",
  technical: "May hurt mobile usability",
  accessibility: "May hurt mobile usability",
  performance: "May slow page performance",
  seo: "May reduce search visibility",
  forms: "May reduce conversions",
  cta: "May reduce conversions",
}

const SCORE_CATEGORY_IMPACT_AREA: Record<ScoreCategory, string> = {
  conversion: "conversion",
  trust: "trust",
  mobile: "mobile usability",
  ux: "user experience",
}

const SEO_CATEGORIES = new Set<IntelligenceCategory>(["seo"])
const TECHNICAL_RULE_PREFIXES = ["tech-", "a11y-"]

const DIFFICULTY: Record<FindingSeverity, RuleDifficulty> = {
  critical: "medium",
  high: "medium",
  medium: "low",
  low: "low",
}

function severityRank(severity: FindingSeverity): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[severity]
}

function estimateRecovery(finding: IntelligenceFindingDraft): number {
  const baseUnits = SEVERITY_IMPACT_WEIGHT[finding.severity]
  const policy = CATEGORY_SCORING_POLICY_V4[finding.scoreCategory]
  const drop = (baseUnits / policy.budget) * (policy.baseline - policy.floor)
  const weighted = drop * policy.growthWeight
  return Math.round(Math.min(12, Math.max(1, weighted)))
}

function buildTechnicalExplanation(finding: IntelligenceFindingDraft): string {
  const meta = getRuleMetadata(finding.ruleId)
  const category = INTELLIGENCE_CATEGORY_LABELS[finding.category] ?? finding.category
  const evidenceText =
    finding.evidence.length > 0
      ? finding.evidence.map((item) => `${item.label}: ${item.value}`).join("; ")
      : finding.description

  return `${meta?.title ?? finding.title} (${category}) — ${evidenceText}`
}

function buildWhyThisMatters(finding: IntelligenceFindingDraft): string {
  return (
    CATEGORY_WHY[finding.category] ??
    "This issue affects how visitors perceive and interact with the page."
  )
}

function resolveImpactArea(finding: IntelligenceFindingDraft): string {
  if (SEO_CATEGORIES.has(finding.category)) return "SEO"
  if (TECHNICAL_RULE_PREFIXES.some((prefix) => finding.ruleId.startsWith(prefix))) {
    if (finding.scoreCategory === "mobile") return "mobile usability"
    return "technical health"
  }
  return SCORE_CATEGORY_IMPACT_AREA[finding.scoreCategory] ?? finding.category
}

function buildBusinessImpactLabel(finding: IntelligenceFindingDraft): string {
  const area = resolveImpactArea(finding)
  if (finding.severity === "critical" || finding.severity === "high") {
    return `High impact on ${area}`
  }
  if (finding.severity === "medium") {
    return `Medium impact on ${area}`
  }
  return `Low impact on ${area}`
}

function buildBusinessImpact(finding: IntelligenceFindingDraft): {
  statement: BusinessImpactStatement
  label: string
  detail: string
} {
  const statement = CATEGORY_IMPACT[finding.category] ?? "May increase bounce rate"
  const label = buildBusinessImpactLabel(finding)
  const detail = `${label}. ${buildWhyThisMatters(finding)}`
  return { statement, label, detail }
}

/**
 * Builds consultant-grade recommendations strictly from finding evidence.
 * Never invents facts — evidence comes only from detector output.
 */
export function buildConsultantRecommendation(
  finding: IntelligenceFindingDraft,
  index: number,
  pagePath?: string
): ConsultantRecommendation {
  const { statement, label, detail } = buildBusinessImpact(finding)
  const evidenceItems = finding.evidence.length > 0 ? [...finding.evidence] : []

  return {
    id: `consultant-${finding.ruleId}-${finding.pageId ?? "site"}-${index}`,
    ruleId: finding.ruleId,
    title: finding.title,
    severity: finding.severity,
    whyThisMatters: buildWhyThisMatters(finding),
    businessImpact: statement,
    businessImpactLabel: label,
    businessImpactDetail: detail,
    technicalExplanation: buildTechnicalExplanation(finding),
    evidence:
      evidenceItems.length > 0
        ? evidenceItems.map((item) => `${item.label}: ${item.value}`).join(" · ")
        : finding.description,
    evidenceItems,
    recommendation: finding.recommendation,
    estimatedRecovery: estimateRecovery(finding),
    confidence: finding.confidence,
    affectedPageIds: finding.pageId ? [finding.pageId] : [],
    affectedPaths: pagePath ? [pagePath] : [],
    evidenceCount: Math.max(1, evidenceItems.length),
    relatedCategory: finding.category,
    scoreCategory: finding.scoreCategory,
    implementationEffort: DIFFICULTY[finding.severity],
  }
}

function mergeRecommendations(
  existing: MutableConsultantRecommendation,
  draft: ConsultantRecommendation,
  finding: IntelligenceFindingDraft,
  pagePath?: string
): void {
  existing.evidenceCount += draft.evidenceCount
  existing.occurrenceCount = (existing.occurrenceCount ?? 1) + 1

  if (finding.pageId && !existing.affectedPageIds.includes(finding.pageId)) {
    existing.affectedPageIds.push(finding.pageId)
  }
  if (pagePath && !existing.affectedPaths.includes(pagePath)) {
    existing.affectedPaths.push(pagePath)
  }
  if (draft.estimatedRecovery > existing.estimatedRecovery) {
    existing.estimatedRecovery = draft.estimatedRecovery
  }
  if (severityRank(finding.severity) < severityRank(existing.severity)) {
    existing.severity = finding.severity
    existing.businessImpactLabel = draft.businessImpactLabel
    existing.businessImpactDetail = draft.businessImpactDetail
  }
  if (draft.confidence > existing.confidence) {
    existing.confidence = draft.confidence
  }
  if (draft.evidenceItems.length > 0) {
    existing.evidenceItems.push(...draft.evidenceItems)
    existing.evidence = existing.evidenceItems
      .map((item) => `${item.label}: ${item.value}`)
      .join(" · ")
  }
}

type MutableConsultantRecommendation = ConsultantRecommendation & {
  occurrenceCount?: number
}

/**
 * Consolidates findings into intent-aware, grouped consultant recommendations.
 * Non-applicable rules never produce recommendations.
 */
export function consolidateConsultantRecommendations(
  findings: IntelligenceFindingDraft[],
  pagePathById: Map<string, string>,
  websiteIntent: WebsiteIntent = "unknown"
): ConsultantRecommendation[] {
  const applicableFindings = findings.filter(
    (finding) =>
      isRuleApplicableToWebsiteIntent(finding.ruleId, websiteIntent) &&
      !finding.excludeFromScoring &&
      !finding.suppressRecommendation &&
      finding.detectionOutcome !== "could_not_verify"
  )

  const groups = new Map<string, MutableConsultantRecommendation>()

  applicableFindings.forEach((finding, index) => {
    const pagePath = finding.pageId ? pagePathById.get(finding.pageId) : undefined
    const key = finding.ruleId
    const draft = buildConsultantRecommendation(finding, index, pagePath)
    const existing = groups.get(key)

    if (!existing) {
      groups.set(key, { ...draft, occurrenceCount: 1 })
      return
    }

    mergeRecommendations(existing, draft, finding, pagePath)
  })

  return [...groups.values()]
    .map(({ occurrenceCount, ...rec }) => {
      void occurrenceCount
      return rec
    })
    .sort((a, b) => {
      const severityDelta = severityRank(a.severity) - severityRank(b.severity)
      if (severityDelta !== 0) return severityDelta
      return b.affectedPaths.length - a.affectedPaths.length || b.estimatedRecovery - a.estimatedRecovery
    })
}

export const PAGE_SCORE_EQUATION = [
  `pageScore = clamp(${GROWTH_SCORE_POLICY_V4.pageScoreBase} − (penaltyUnits / ${GROWTH_SCORE_POLICY_V4.pageScoreBudget}) × ${GROWTH_SCORE_POLICY_V4.pageScoreBase}, 0, ${GROWTH_SCORE_POLICY_V4.maxPageScore})`,
  "penaltyUnits = Σ(impactWeight × confidence × pageWeight × clusterDiminishing)",
  "Site-wide findings affect Growth Score only — not individual page scores",
].join("\n")
