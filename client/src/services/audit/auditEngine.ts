import { COMMON_PAGE_DEFINITIONS } from "@/services/audit/constants"
import { discoverPages } from "@/services/audit/pageDiscovery"
import { fetchPageContentSnapshots } from "@/services/audit/pageContentService"
import { resolvePageDisplayTitle } from "@/services/audit/pageTitleResolver"
import { createAuditFetchContext } from "@/services/audit/fetch/types"
import { createScorePlaceholders, runAuditRules } from "@/services/audit/auditRules"
import { attachScreenshotsToPages } from "@/services/audit/screenshotService"
import {
  toPersistedFinding,
} from "@/services/audit/scoring/calculateAuditScore"
import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import { delay } from "@/services/internal/delay"
import {
  serializeIntelligenceSnapshot,
  type IntelligenceSnapshot,
} from "@/services/audit/intelligence/diagnostics/intelligenceSnapshot"
import { SCORING_ENGINE_VERSION } from "@/services/audit/intelligence/scoring/scoringPolicy"
import * as auditListRepository from "@/services/internal/auditListRepository"
import {
  createFindings,
  createHistoryEvent,
  createPages,
  createScores,
  getSessionById,
  updatePage,
  updateSessionStatus,
  upsertScores,
} from "@/services/repositories/audit/provider"
import { parseDomainFromUrl } from "@/lib/auditUrlValidation"
import { SCORE_CATEGORY_DEFINITIONS } from "@/services/audit/constants"
import type { AuditFinding, AuditPage, AuditScore, AuditSession } from "@/types/auditEngine"

const PHASE_DELAYS_MS = {
  crawling: 900,
  analyzing: 1100,
  finalizing: 600,
} as const

function getPageTitle(
  candidateTitle: string | undefined,
  pageType: AuditPage["pageType"]
): string {
  if (candidateTitle?.trim()) return candidateTitle.trim()

  return (
    COMMON_PAGE_DEFINITIONS.find((definition) => definition.pageType === pageType)?.title ??
    "Page"
  )
}

async function mapDiscoveredPages(
  auditId: string,
  baseUrl: string,
  fetchContext: ReturnType<typeof createAuditFetchContext>
): Promise<{
  pages: AuditPage[]
  crawlDiagnostics: import("@/services/audit/intelligence/diagnostics/crawlDiagnostics").CrawlDiagnostics
}> {
  const discovery = await discoverPages(baseUrl, undefined, fetchContext)

  const pages = discovery.pages.map((candidate) => ({
    id: crypto.randomUUID(),
    auditId,
    pageType: candidate.pageType,
    url: candidate.url,
    path: candidate.path,
    title: getPageTitle(candidate.title, candidate.pageType),
    discoveryStatus: candidate.discoveryStatus,
    discoveredAt: new Date().toISOString(),
    screenshots: {
      desktop: {
        viewport: "desktop" as const,
        storageKey: "",
        captureStatus: "pending" as const,
        width: 0,
        height: 0,
        placeholderLabel: "",
      },
      mobile: {
        viewport: "mobile" as const,
        storageKey: "",
        captureStatus: "pending" as const,
        width: 0,
        height: 0,
        placeholderLabel: "",
      },
    },
  }))

  return { pages, crawlDiagnostics: discovery.diagnostics }
}

async function recordPhase(
  session: AuditSession,
  status: AuditSession["status"],
  message: string
): Promise<AuditSession> {
  await createHistoryEvent(session.id, status, message)
  return (await updateSessionStatus(session.id, status)) ?? session
}

function buildComputedScores(
  auditId: string,
  categoryScores: Record<ScoreCategory, number>,
  growthScore: number,
  v3Metrics?: {
    auditConfidence: number
    growthPotential: number
    scoreCeiling: number
  }
): AuditScore[] {
  const now = new Date().toISOString()

  const auxiliaryScores: Partial<Record<string, number>> = v3Metrics
    ? {
        clarity: v3Metrics.auditConfidence,
        overall: v3Metrics.growthPotential,
        friction: v3Metrics.scoreCeiling,
      }
    : {}

  const scores: AuditScore[] = SCORE_CATEGORY_DEFINITIONS.map((definition) => {
    let score: number | null = null

    if (definition.category === "growth") {
      score = growthScore
    } else if (definition.category in categoryScores) {
      score = categoryScores[definition.category as keyof typeof categoryScores]
    } else if (definition.category in auxiliaryScores) {
      score = auxiliaryScores[definition.category] ?? null
    }

    return {
      id: crypto.randomUUID(),
      auditId,
      category: definition.category,
      score,
      maxScore: definition.maxScore,
      label: definition.label,
      createdAt: now,
      updatedAt: now,
    }
  })

  return scores
}

export async function runAuditEngine(auditId: string): Promise<void> {
  const session = await getSessionById(auditId)
  if (!session) return

  try {
    await recordPhase(session, "crawling", "Discovering public pages")
    await delay(PHASE_DELAYS_MS.crawling)

    const fetchContext = createAuditFetchContext()
    const { pages: discovered, crawlDiagnostics } = await mapDiscoveredPages(
      auditId,
      session.websiteUrl,
      fetchContext
    )

    if (discovered.length === 0) {
      const detail =
        crawlDiagnostics.crawlStoppedDetail ??
        crawlDiagnostics.crawlError ??
        "Unable to reach the website. Verify the URL is public and accessible over HTTPS."
      throw new Error(detail)
    }

    const pagesWithScreenshots = attachScreenshotsToPages(discovered)
    const savedPages = await createPages(pagesWithScreenshots)

    const analyzingSession =
      (await updateSessionStatus(auditId, "analyzing")) ?? session
    await createHistoryEvent(
      auditId,
      "analyzing",
      `Discovered ${savedPages.length} verified pages on ${parseDomainFromUrl(session.websiteUrl)}`
    )

    await delay(PHASE_DELAYS_MS.analyzing)

    const pageSnapshots = await fetchPageContentSnapshots(savedPages, fetchContext)

    const pagesForAnalysis = await Promise.all(
      savedPages.map(async (page) => {
        const snapshot = pageSnapshots.find((item) => item.page.id === page.id)
        if (!snapshot) return page

        const title = resolvePageDisplayTitle(page.path, snapshot.html, {
          contentSource: snapshot.contentSource,
          renderDiagnostics: snapshot.renderDiagnostics,
        })

        if (title === page.title) {
          return { ...page, title }
        }

        const updated = await updatePage(page.id, { title })
        return updated ?? { ...page, title }
      })
    )

    const analysisSnapshots = pageSnapshots.map((snapshot) => {
      const page = pagesForAnalysis.find((item) => item.id === snapshot.page.id)
      return page ? { ...snapshot, page } : snapshot
    })

    await createScores(createScorePlaceholders(auditId))

    const { findings: scoredFindings, categories, growthScore, scoring, execution, pageScores } =
      await runAuditRules(
      {
        session: analyzingSession,
        pages: pagesForAnalysis,
        pageSnapshots: analysisSnapshots,
        spaMode: fetchContext.spaMode,
      },
      {
        onPageAnalyzed: async (snapshot, findingCount) => {
          await createHistoryEvent(
            auditId,
            "analyzing",
            `Analyzed ${snapshot.page.path} — ${findingCount} finding${findingCount === 1 ? "" : "s"}`
          )
        },
      }
    )

    if (scoredFindings.length > 0) {
      const now = new Date().toISOString()
      const findings: AuditFinding[] = scoredFindings.map((finding) => ({
        ...toPersistedFinding(finding),
        id: crypto.randomUUID(),
        auditId,
        createdAt: now,
      }))
      await createFindings(findings)
    }

    await upsertScores(
      buildComputedScores(auditId, categories, growthScore, {
        auditConfidence: scoring.auditConfidence.score,
        growthPotential: scoring.growthPotential.growthPotential,
        scoreCeiling: scoring.scoreCeiling,
      })
    )

    const completedAt = new Date().toISOString()

    const finalCrawlDiagnostics = {
      ...crawlDiagnostics,
      pagesAnalyzed: pagesForAnalysis.length,
      pagesSkippedAnalysis: Math.max(0, savedPages.length - pagesForAnalysis.length),
    }

    const intelligenceSnapshot: IntelligenceSnapshot = {
      version: 1,
      pageScores,
      pageIntents: Object.fromEntries(
        Object.entries(execution.pageIntents).map(([pageId, detected]) => [
          pageId,
          detected.pageIntent,
        ])
      ),
      auditConfidence: scoring.auditConfidence.score,
      growthPotential: scoring.growthPotential.growthPotential,
      scoreCeiling: scoring.scoreCeiling,
      consultantRecommendations: execution.consultantRecommendations?.slice(0, 12),
      websiteIntent: execution.websiteIntent,
      strengths: execution.strengths,
      groupedFindings: execution.groupedFindings,
      reportScoreExplanation: execution.reportScoreExplanation,
      crawlDiagnostics: finalCrawlDiagnostics,
      renderConfidence: execution.renderConfidence,
      reliabilityReport: execution.reliabilityReport,
      auditConfidenceTier: scoring.auditConfidence.tier,
      manualVerificationRecommended: scoring.auditConfidence.manualVerificationRecommended,
      engineDiagnostics: execution.engineDiagnostics
        ? {
            ...execution.engineDiagnostics,
            crawlDiagnostics: finalCrawlDiagnostics,
          }
        : undefined,
      comparisonRecord: {
        auditId,
        websiteUrl: analyzingSession.websiteUrl,
        domain: parseDomainFromUrl(analyzingSession.websiteUrl),
        auditedAt: completedAt,
        growthScore,
        growthPotential: scoring.growthPotential.growthPotential,
        scoreCeiling: scoring.scoreCeiling,
        findingsCount: scoredFindings.length,
        pagesAnalyzed: pagesForAnalysis.length,
        auditEngineVersion: SCORING_ENGINE_VERSION,
      },
    }

    await createHistoryEvent(auditId, "analyzing", serializeIntelligenceSnapshot(intelligenceSnapshot))

    const ceilingNote =
      scoring.appliedBlockers.length > 0
        ? ` (ceiling ${scoring.scoreCeiling} — ${scoring.appliedBlockers.length} blocker${scoring.appliedBlockers.length === 1 ? "" : "s"})`
        : ""

    await delay(PHASE_DELAYS_MS.finalizing)

    await createHistoryEvent(
      auditId,
      "completed",
      `Audit completed with Growth Score ${growthScore}${ceilingNote} across ${scoredFindings.length} findings`
    )
    await updateSessionStatus(auditId, "completed")
    await auditListRepository.syncAuditFromSession(auditId)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Audit session failed unexpectedly"

    await createHistoryEvent(auditId, "failed", message)
    await updateSessionStatus(auditId, "failed", message)
    await auditListRepository.syncAuditFromSession(auditId)
  }
}

export function startAuditEngine(auditId: string): void {
  void runAuditEngine(auditId)
}
