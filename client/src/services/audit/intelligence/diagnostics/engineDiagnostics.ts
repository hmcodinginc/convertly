import type { DetectedWebsiteIntent } from "@/services/audit/intelligence/websiteIntentTypes"
import type {
  AppliedRuleRecord,
  RuleExecutionSummary,
  SkippedRuleRecord,
} from "@/services/audit/intelligence/execution/ruleExecutionTracker"
import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"
import type { ConsultantRecommendation } from "@/services/audit/intelligence/recommendations/consultantRecommendation"
import type { AppliedBlocker } from "@/services/audit/intelligence/scoring/scoringEngineV2"
import type { CrawlDiagnostics } from "@/services/audit/intelligence/diagnostics/crawlDiagnostics"
import type { ScoringEngineV3Result } from "@/services/audit/intelligence/scoring/scoringEngineV3"
import { getRuleMetadata } from "@/services/audit/intelligence/rules/ruleMetadata"
import { evaluateRuleExecutionApplicability } from "@/services/audit/intelligence/applicability/applicabilityEngine"
import type { WebsiteIntent } from "@/services/audit/intelligence/websiteIntentTypes"
import type { PageIntent } from "@/services/audit/intelligence/pageIntentTypes"

const PAGE_INTENT_SKIP_REASONS = new Set([
  "excluded_page_type",
  "not_applicable_page_type",
  "pack_not_allowed_for_intent",
  "pack_ignored_for_intent",
  "page_analysis_gate_failed",
])

export type IntentDiagnostics = {
  websiteIntent: string
  confidence: number
  signals: string[]
  pageIntents: Record<string, string>
}

export type ApplicabilityRuleRecord = {
  ruleId: string
  websiteIntent: WebsiteIntent
  pageIntent?: PageIntent
  applicable: boolean
  reason: string | null
  executionPrevented: boolean
  findingCreated: boolean
  recommendationCreated: boolean
  scoreContribution: boolean
}

export type FindingTraceRecord = {
  ruleId: string
  pageId?: string
  category: string
  websiteIntent: string
  pageIntent?: string
  confidence: number
  verificationStatus?: string
  excludeFromScoring?: boolean
  suppressRecommendation?: boolean
}

export type RecommendationTraceRecord = {
  ruleId: string
  title: string
  source: "executed_rule"
}

export type ScoringDiagnostics = {
  growthScore: number
  scoreCeiling: number | null
  appliedBlockers: AppliedBlocker[]
  auditConfidence: number
}

/**
 * Internal V5 engine diagnostics — debugging only, never surfaced in UI.
 */
export type EngineDiagnostics = {
  websiteIntent: string
  confidence: number
  rulesRegistered: number
  rulesSelected: number
  rulesExecuted: number
  skippedByIntent: number
  skippedByPageIntent: number
  skippedByReliability: number
  skippedByRender: number
  findingsProduced: number
  recommendationsProduced: number
  blockersApplied: AppliedBlocker[]
  blockerCeiling: number | null
  intentDiagnostics: IntentDiagnostics
  applicabilityDiagnostics: ApplicabilityRuleRecord[]
  ruleExecutionDiagnostics: {
    applied: AppliedRuleRecord[]
    skipped: SkippedRuleRecord[]
  }
  findingDiagnostics: FindingTraceRecord[]
  recommendationDiagnostics: RecommendationTraceRecord[]
  scoringDiagnostics: ScoringDiagnostics
  crawlDiagnostics?: CrawlDiagnostics
}

function buildApplicabilityAudit(input: {
  websiteIntent: WebsiteIntent
  ruleExecution: RuleExecutionSummary
  findings: IntelligenceFindingDraft[]
  consultantRecommendations: ConsultantRecommendation[]
  pageIntents: Record<string, string>
}): ApplicabilityRuleRecord[] {
  const findingRuleIds = new Set(input.findings.map((f) => f.ruleId))
  const recRuleIds = new Set(input.consultantRecommendations.map((r) => r.ruleId))

  const records = new Map<string, ApplicabilityRuleRecord>()

  for (const skipped of input.ruleExecution.skippedRules) {
    const key = `${skipped.ruleId}:${skipped.pageId ?? "site"}`
    records.set(key, {
      ruleId: skipped.ruleId,
      websiteIntent: input.websiteIntent,
      pageIntent: skipped.pageIntent,
      applicable: false,
      reason: skipped.reason,
      executionPrevented: true,
      findingCreated: findingRuleIds.has(skipped.ruleId),
      recommendationCreated: recRuleIds.has(skipped.ruleId),
      scoreContribution: false,
    })
  }

  for (const applied of input.ruleExecution.appliedRules) {
    const key = `${applied.ruleId}:${applied.pageId ?? "site"}`
    const pageIntent = applied.pageIntent ?? (applied.pageId ? input.pageIntents[applied.pageId] as PageIntent | undefined : undefined)
    const decision = evaluateRuleExecutionApplicability(applied.ruleId, {
      websiteIntent: input.websiteIntent,
      pageIntent,
    })

    records.set(key, {
      ruleId: applied.ruleId,
      websiteIntent: input.websiteIntent,
      pageIntent,
      applicable: decision.applicable,
      reason: decision.reason,
      executionPrevented: false,
      findingCreated: applied.findingCount > 0,
      recommendationCreated: recRuleIds.has(applied.ruleId),
      scoreContribution: applied.findingCount > 0 && findingRuleIds.has(applied.ruleId),
    })
  }

  return [...records.values()]
}

export function buildEngineDiagnostics(input: {
  websiteIntent: DetectedWebsiteIntent
  pageIntents: Record<string, string>
  rulesRegistered: number
  rulesSelected: number
  ruleExecution: RuleExecutionSummary
  findings: IntelligenceFindingDraft[]
  consultantRecommendations: ConsultantRecommendation[]
  appliedBlockers: AppliedBlocker[]
  blockerCeiling: number | null
  scoring: Pick<ScoringEngineV3Result, "growthScore" | "auditConfidence">
  crawlDiagnostics?: CrawlDiagnostics
}): EngineDiagnostics {
  const { skippedRules } = input.ruleExecution

  const skippedByIntent = skippedRules.filter(
    (record) => record.reason === "not_applicable_website_intent"
  ).length

  const skippedByPageIntent = skippedRules.filter((record) =>
    PAGE_INTENT_SKIP_REASONS.has(record.reason)
  ).length

  const skippedByRender = skippedRules.filter(
    (record) => record.reason === "low_render_confidence"
  ).length

  const skippedByReliability = input.findings.filter(
    (finding) =>
      finding.excludeFromScoring === true ||
      finding.suppressRecommendation === true ||
      finding.detectionOutcome === "could_not_verify"
  ).length

  const applicabilityDiagnostics = buildApplicabilityAudit({
    websiteIntent: input.websiteIntent.websiteIntent,
    ruleExecution: input.ruleExecution,
    findings: input.findings,
    consultantRecommendations: input.consultantRecommendations,
    pageIntents: input.pageIntents,
  })

  return {
    websiteIntent: input.websiteIntent.websiteIntent,
    confidence: input.websiteIntent.confidence,
    rulesRegistered: input.rulesRegistered,
    rulesSelected: input.rulesSelected,
    rulesExecuted: input.ruleExecution.appliedRules.length,
    skippedByIntent,
    skippedByPageIntent,
    skippedByReliability,
    skippedByRender,
    findingsProduced: input.findings.length,
    recommendationsProduced: input.consultantRecommendations.length,
    blockersApplied: input.appliedBlockers,
    blockerCeiling: input.blockerCeiling,
    intentDiagnostics: {
      websiteIntent: input.websiteIntent.websiteIntent,
      confidence: input.websiteIntent.confidence,
      signals: input.websiteIntent.signals,
      pageIntents: input.pageIntents,
    },
    applicabilityDiagnostics,
    ruleExecutionDiagnostics: {
      applied: input.ruleExecution.appliedRules,
      skipped: input.ruleExecution.skippedRules,
    },
    findingDiagnostics: input.findings.map((finding) => ({
      ruleId: finding.ruleId,
      pageId: finding.pageId,
      category: finding.category,
      websiteIntent: input.websiteIntent.websiteIntent,
      pageIntent: finding.pageId ? input.pageIntents[finding.pageId] : undefined,
      confidence: finding.confidence,
      verificationStatus: finding.verificationStatus,
      excludeFromScoring: finding.excludeFromScoring,
      suppressRecommendation: finding.suppressRecommendation,
    })),
    recommendationDiagnostics: input.consultantRecommendations.map((rec) => ({
      ruleId: rec.ruleId,
      title: rec.title,
      source: "executed_rule" as const,
    })),
    scoringDiagnostics: {
      growthScore: input.scoring.growthScore,
      scoreCeiling: input.blockerCeiling,
      appliedBlockers: input.appliedBlockers,
      auditConfidence: input.scoring.auditConfidence.score,
    },
    crawlDiagnostics: input.crawlDiagnostics,
  }
}

/** Verification table row for intent/pack audit */
export function buildIntentVerificationRow(input: {
  website: string
  websiteIntent: DetectedWebsiteIntent
  rulesExecuted: number
  rulesSkippedByIntent: number
  croRulesExecuted: number
  expectedIntent: string
}): Record<string, string | number | boolean> {
  return {
    website: input.website,
    detectedIntent: input.websiteIntent.websiteIntent,
    confidence: input.websiteIntent.confidence,
    executedRules: input.rulesExecuted,
    skippedByIntent: input.rulesSkippedByIntent,
    croRulesExecuted: input.croRulesExecuted,
    expectedIntent: input.expectedIntent,
    verified:
      input.websiteIntent.websiteIntent === input.expectedIntent && input.croRulesExecuted === 0,
  }
}

export function isCroRuleId(ruleId: string): boolean {
  const meta = getRuleMetadata(ruleId)
  if (!meta) return false
  return meta.packIds.some((pack) => pack.includes("conversion") || pack.includes("trust"))
}
