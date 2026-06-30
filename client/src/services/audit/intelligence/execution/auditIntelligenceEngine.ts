import type { PageContentSnapshot } from "@/services/audit/pageContentService"
import {
  dedupeFindings,
  executePageRules,
  executeSiteRules,
  toScoredFindingInputs,
  countApplicableRuleEvaluations,
  countExecutedRuleEvaluations,
} from "@/services/audit/intelligence/execution/ruleExecutor"
import { calculateAuditScoreV3 } from "@/services/audit/intelligence/scoring/scoringEngineV3"
import type { ScoringEngineV3Result } from "@/services/audit/intelligence/scoring/scoringEngineV3"
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
  categories: ScoringEngineV3Result["categories"]
  growthScore: number
  pageScores: Record<string, number>
  scoring: ScoringEngineV3Result
}> {
  const pageFindings: IntelligenceFindingDraft[] = []
  const eligibleSnapshots = getSnapshotsEligibleForRules(context.pageSnapshots)

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

  const siteContext: SiteRuleContext = {
    session: context.session,
    pages: context.pages,
    pageSnapshots: context.pageSnapshots,
  }

  const siteFindings = await executeSiteRules(siteContext)
  const intelligenceFindings = dedupeFindings([...pageFindings, ...siteFindings])
  const scoredFindings = toScoredFindingInputs(intelligenceFindings)

  const analyzedPageIds = new Set(eligibleSnapshots.map((snapshot) => snapshot.page.id))
  const analyzedPages = context.pages.filter((page) => analyzedPageIds.has(page.id))

  const scoring = calculateAuditScoreV3(intelligenceFindings, context.pages, {
    analyzedPageIds,
    pageSnapshots: context.pageSnapshots,
    applicableRuleCount: countApplicableRuleEvaluations(context.pages),
    executedRuleCount: countExecutedRuleEvaluations(analyzedPages),
  })

  const { categories, growthScore, pageScores } = scoring

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
    scoring,
  }
}
