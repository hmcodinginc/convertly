import type { PageContentSnapshot } from "@/services/audit/pageContentService"
import {
  dedupeFindings,
  executePageRules,
  executeSiteRules,
  toScoredFindingInputs,
  countApplicableRuleEvaluations,
  countExecutedRuleEvaluations,
} from "@/services/audit/intelligence/execution/ruleExecutor"
import { RuleExecutionTracker } from "@/services/audit/intelligence/execution/ruleExecutionTracker"
import { calculateAuditScoreV3 } from "@/services/audit/intelligence/scoring/scoringEngineV3"
import type { ScoringEngineV3Result } from "@/services/audit/intelligence/scoring/scoringEngineV3"
import { buildScoreExplanation } from "@/services/audit/intelligence/scoring/scoreExplanation"
import { consolidateConsultantRecommendations } from "@/services/audit/intelligence/recommendations/consultantRecommendation"
import { groupIntelligenceFindings } from "@/services/audit/intelligence/findings/groupedFindings"
import { buildAuditStrengths } from "@/services/audit/intelligence/reporting/auditStrengths"
import { buildReportScoreExplanation } from "@/services/audit/intelligence/reporting/reportScoreExplanation"
import {
  assessSiteRenderConfidence,
} from "@/services/audit/intelligence/rendering/renderConfidence"
import {
  applyRenderReliabilityToFindings,
  buildRenderReliabilityContext,
  buildReliabilityReport,
  computeRenderSensitiveVerificationStats,
} from "@/services/audit/intelligence/rendering/renderReliability"
import { annotateViewportBestPracticeFindings } from "@/services/audit/intelligence/scoring/viewportBlockerEligibility"
import {
  buildEngineDiagnostics,
} from "@/services/audit/intelligence/diagnostics/engineDiagnostics"
import { getRuleRegistry } from "@/services/audit/intelligence/rules/ruleRegistry"
import { SCORING_ENGINE_VERSION } from "@/services/audit/intelligence/scoring/scoringPolicy"
import { detectWebsiteIntent } from "@/services/audit/intelligence/websiteIntentDetection"
import { detectPageIntent } from "@/services/audit/intelligence/pageIntentDetection"
import { getRuleIdsForIntent } from "@/services/audit/intelligence/pageIntentDetection"
import type {
  IntelligenceExecutionResult,
  IntelligenceFindingDraft,
  PageRuleContext,
  SiteRuleContext,
} from "@/services/audit/intelligence/types"
import type { AuditRuleContext } from "@/types/auditEngine"
import type { ScoredFindingInput } from "@/services/audit/scoring/calculateAuditScore"
import { verifyPageAnalysisGate } from "@/services/audit/debug/pageSnapshotDiagnostics"

export type IntelligenceEngineOptions = {
  onPageAnalyzed?: (snapshot: PageContentSnapshot, findingCount: number) => void | Promise<void>
}

function getSnapshotsEligibleForRules(
  snapshots: PageContentSnapshot[],
  spaMode = false
): PageContentSnapshot[] {
  return snapshots.filter((snapshot) => {
    if (!snapshot.fetchSucceeded || !snapshot.document) return false
    if (!snapshot.analyzed) return false
    return verifyPageAnalysisGate(snapshot, { spaMode }).passed
  })
}

export async function runIntelligenceEngine(
  context: AuditRuleContext,
  options: IntelligenceEngineOptions = {}
): Promise<{
  intelligenceFindings: IntelligenceFindingDraft[]
  scoredFindings: ScoredFindingInput[]
  execution: IntelligenceExecutionResult
  categories: ScoringEngineV3Result["categories"]
  growthScore: number
  pageScores: Record<string, number>
  scoring: ScoringEngineV3Result
}> {
  const pageFindings: IntelligenceFindingDraft[] = []
  const pageIntents: IntelligenceExecutionResult["pageIntents"] = {}
  const tracker = new RuleExecutionTracker()
  const spaMode = context.spaMode ?? false
  const eligibleSnapshots = getSnapshotsEligibleForRules(context.pageSnapshots, spaMode)
  const eligibleIds = new Set(eligibleSnapshots.map((snapshot) => snapshot.page.id))
  const analyzedPageIds = new Set(eligibleSnapshots.map((snapshot) => snapshot.page.id))

  const renderConfidence = assessSiteRenderConfidence(context.pageSnapshots, analyzedPageIds)

  // Website intent must be known before any rule executes (Intelligence V5).
  const websiteIntent = detectWebsiteIntent({
    session: context.session,
    pages: context.pages,
    pageSnapshots: context.pageSnapshots,
  })

  for (const snapshot of context.pageSnapshots) {
    const detected = detectPageIntent({ page: snapshot.page, snapshot })
    pageIntents[snapshot.page.id] = detected

    if (!eligibleIds.has(snapshot.page.id)) {
      const skippedRuleIds = getRuleIdsForIntent(detected.pageIntent)
      tracker.recordGateSkippedPage({
        pageId: snapshot.page.id,
        pagePath: snapshot.page.path,
        ruleIds: skippedRuleIds,
        pageIntent: detected.pageIntent,
      })
    }
  }

  for (const snapshot of eligibleSnapshots) {
    const pageContext: PageRuleContext = {
      session: context.session,
      pages: context.pages,
      pageSnapshots: context.pageSnapshots,
      currentSnapshot: snapshot,
    }

    const { findings } = await executePageRules(pageContext, tracker, {
      websiteIntent: websiteIntent.websiteIntent,
      trustworthyForUxRules:
        renderConfidence.pageConfidence[snapshot.page.id]?.trustworthyForUxRules ??
        renderConfidence.trustworthyForUxRules,
    })
    pageFindings.push(...findings)
    await options.onPageAnalyzed?.(snapshot, findings.length)
  }

  const siteContext: SiteRuleContext = {
    session: context.session,
    pages: context.pages,
    pageSnapshots: context.pageSnapshots,
  }

  const siteFindings = await executeSiteRules(siteContext, tracker, {
    websiteIntent: websiteIntent.websiteIntent,
  })
  const rawFindings = dedupeFindings([...pageFindings, ...siteFindings])

  const reliabilityContext = buildRenderReliabilityContext({
    websiteUrl: context.session.websiteUrl,
    websiteIntent: websiteIntent.websiteIntent,
    siteRenderConfidence: renderConfidence,
  })

  const intelligenceFindings = applyRenderReliabilityToFindings(rawFindings, reliabilityContext)
  const scoredFindings = toScoredFindingInputs(intelligenceFindings)

  const analyzedPages = context.pages.filter((page) => analyzedPageIds.has(page.id))
  const snapshotsByPageId = new Map(
    context.pageSnapshots.map((snapshot) => [snapshot.page.id, snapshot])
  )
  const skippedPageCount = context.pageSnapshots.length - eligibleSnapshots.length
  const blockedPageCount = context.pageSnapshots.filter((snapshot) => !snapshot.fetchSucceeded).length

  const ruleExecution = tracker.buildSummary()
  const verificationStats = computeRenderSensitiveVerificationStats(
    intelligenceFindings,
    ruleExecution
  )

  const intentSuppressedRuleIds = [
    ...new Set(
      ruleExecution.skippedRules
        .filter(
          (record) =>
            record.reason === "excluded_page_type" ||
            record.reason === "not_applicable_page_type" ||
            record.reason === "not_applicable_website_intent" ||
            record.reason === "pack_not_allowed_for_intent" ||
            record.reason === "pack_ignored_for_intent" ||
            record.reason === "site_rule_not_applicable"
        )
        .map((record) => record.ruleId)
    ),
  ]

  const reliabilityReport = buildReliabilityReport({
    findings: intelligenceFindings,
    ruleExecution,
    context: reliabilityContext,
    intentSuppressedRuleIds,
  })

  const scoring = calculateAuditScoreV3(intelligenceFindings, context.pages, {
    analyzedPageIds,
    pageSnapshots: context.pageSnapshots,
    applicableRuleCount: countApplicableRuleEvaluations(
      context.pages,
      snapshotsByPageId,
      websiteIntent.websiteIntent
    ),
    executedRuleCount: countExecutedRuleEvaluations(
      analyzedPages,
      snapshotsByPageId,
      websiteIntent.websiteIntent
    ),
    skippedPageCount,
    websiteIntent,
    ruleExecution,
    renderConfidenceScore: renderConfidence.score,
    blockedPageCount,
    crawlFailureCount: blockedPageCount,
    renderSensitiveUnverifiedRatio: verificationStats.unverifiedRatio,
    highRiskPlatform: reliabilityContext.highRiskPlatform,
  })

  const annotatedFindings = annotateViewportBestPracticeFindings(
    intelligenceFindings,
    scoring.appliedBlockers
  )

  const { categories, growthScore, pageScores } = scoring
  const scoreExplanation = buildScoreExplanation({
    scoring,
    growthPotential: scoring.growthPotential,
    findings: annotatedFindings,
    pages: context.pages,
    ruleExecution,
  })

  const pagePathById = new Map(context.pages.map((page) => [page.id, page.path]))
  const consultantRecommendations = consolidateConsultantRecommendations(
    annotatedFindings,
    pagePathById,
    websiteIntent.websiteIntent
  )
  const groupedFindings = groupIntelligenceFindings(annotatedFindings, pagePathById)
  const strengths = scoring.positiveScoring
    ? buildAuditStrengths(scoring.positiveScoring)
    : []
  const reportScoreExplanation = buildReportScoreExplanation({
    scoring,
    scoreExplanation,
    positiveScoring: scoring.positiveScoring,
  })

  const pageIntentMap = Object.fromEntries(
    Object.entries(pageIntents).map(([pageId, detected]) => [pageId, detected.pageIntent])
  )

  const engineDiagnostics = buildEngineDiagnostics({
    websiteIntent,
    pageIntents: pageIntentMap,
    rulesRegistered: getRuleRegistry().getAll().length,
    rulesSelected: countApplicableRuleEvaluations(
      context.pages,
      snapshotsByPageId,
      websiteIntent.websiteIntent
    ),
    ruleExecution,
    findings: annotatedFindings,
    consultantRecommendations,
    appliedBlockers: scoring.appliedBlockers,
    blockerCeiling: scoring.scoreCeiling,
    scoring,
  })

  const execution: IntelligenceExecutionResult = {
    findings: annotatedFindings,
    pageScores,
    siteFindingsCount: siteFindings.length,
    pageFindingsCount: pageFindings.length,
    analyzedPageIds: eligibleSnapshots.map((snapshot) => snapshot.page.id),
    pageIntents,
    ruleExecution,
    scoreExplanation,
    reportScoreExplanation,
    consultantRecommendations,
    strengths,
    groupedFindings,
    websiteIntent,
    renderConfidence,
    reliabilityReport,
    engineDiagnostics,
  }

  return {
    intelligenceFindings: annotatedFindings,
    scoredFindings,
    execution,
    categories,
    growthScore,
    pageScores,
    scoring,
  }
}
