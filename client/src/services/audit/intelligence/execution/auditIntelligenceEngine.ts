import type { PageContentSnapshot } from "@/services/audit/pageContentService"
import {
  dedupeFindings,
  executePageRules,
  executeSiteRules,
  toScoredFindingInputs,
} from "@/services/audit/intelligence/execution/ruleExecutor"
import { calculateAuditScoreV2 } from "@/services/audit/intelligence/scoring/scoringEngineV2"
import type {
  IntelligenceExecutionResult,
  IntelligenceFindingDraft,
  PageRuleContext,
  SiteRuleContext,
} from "@/services/audit/intelligence/types"
import type { AuditRuleContext } from "@/types/auditEngine"
import type { ScoredFindingInput } from "@/services/audit/scoring/calculateAuditScore"
import { verifyPageAnalysisGate } from "@/services/audit/debug/pageSnapshotDiagnostics"
import {
  isPageRuleTraceEnabled,
  printAuditRuleTraceSummary,
  resetPageRuleTrace,
} from "@/services/audit/debug/pageRuleEvaluationTrace"

export type IntelligenceEngineOptions = {
  onPageAnalyzed?: (snapshot: PageContentSnapshot, findingCount: number) => void | Promise<void>
}

function getSnapshotsEligibleForRules(snapshots: PageContentSnapshot[]): PageContentSnapshot[] {
  return snapshots.filter((snapshot) => {
    if (!snapshot.fetchSucceeded || !snapshot.document) return false
    if (!snapshot.analyzed) return false
    return verifyPageAnalysisGate(snapshot).passed
  })
}

export async function runIntelligenceEngine(
  context: AuditRuleContext,
  options: IntelligenceEngineOptions = {}
): Promise<{
  intelligenceFindings: IntelligenceFindingDraft[]
  scoredFindings: ScoredFindingInput[]
  execution: IntelligenceExecutionResult
  categories: ReturnType<typeof calculateAuditScoreV2>["categories"]
  growthScore: number
  pageScores: Record<string, number>
}> {
  const pageFindings: IntelligenceFindingDraft[] = []
  const eligibleSnapshots = getSnapshotsEligibleForRules(context.pageSnapshots)

  if (isPageRuleTraceEnabled()) {
    resetPageRuleTrace()
    console.log("")
    console.log("[audit-rule-trace] Page rule evaluation trace enabled")
    console.log(`[audit-rule-trace] Eligible pages: ${eligibleSnapshots.length}`)
    console.log("")
  }

  for (const snapshot of eligibleSnapshots) {
    const pageContext: PageRuleContext = {
      session: context.session,
      pages: context.pages,
      pageSnapshots: context.pageSnapshots,
      currentSnapshot: snapshot,
    }

    const findings = await executePageRules(pageContext)
    pageFindings.push(...findings)
    await options.onPageAnalyzed?.(snapshot, findings.length)
  }

  if (isPageRuleTraceEnabled()) {
    printAuditRuleTraceSummary()
  }

  const siteContext: SiteRuleContext = {
    session: context.session,
    pages: context.pages,
    pageSnapshots: context.pageSnapshots,
  }

  const siteFindings = await executeSiteRules(siteContext)
  const intelligenceFindings = dedupeFindings([...pageFindings, ...siteFindings])
  const scoredFindings = toScoredFindingInputs(intelligenceFindings)

  const analyzedPageIds = new Set(eligibleSnapshots.map((snapshot) => snapshot.page.id))
  const { categories, growthScore, pageScores } = calculateAuditScoreV2(
    intelligenceFindings,
    context.pages,
    analyzedPageIds
  )

  const execution: IntelligenceExecutionResult = {
    findings: intelligenceFindings,
    pageScores,
    siteFindingsCount: siteFindings.length,
    pageFindingsCount: pageFindings.length,
    analyzedPageIds: eligibleSnapshots.map((snapshot) => snapshot.page.id),
  }

  return {
    intelligenceFindings,
    scoredFindings,
    execution,
    categories,
    growthScore,
    pageScores,
  }
}
