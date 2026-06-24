import { COMMON_PAGE_DEFINITIONS } from "@/services/audit/constants"
import { discoverPages } from "@/services/audit/pageDiscovery"
import { fetchPageContentSnapshots } from "@/services/audit/pageContentService"
import { createAuditFetchContext } from "@/services/audit/fetch/types"
import { createScorePlaceholders, runAuditRules } from "@/services/audit/auditRules"
import { attachScreenshotsToPages } from "@/services/audit/screenshotService"
import {
  calculateAuditScore,
  toPersistedFinding,
} from "@/services/audit/scoring/calculateAuditScore"
import { delay } from "@/services/internal/delay"
import * as auditListRepository from "@/services/internal/auditListRepository"
import {
  createFindings,
  createHistoryEvent,
  createPages,
  createScores,
  getSessionById,
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
): Promise<AuditPage[]> {
  const candidates = await discoverPages(baseUrl, undefined, fetchContext)

  return candidates.map((candidate) => ({
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
  categoryScores: ReturnType<typeof calculateAuditScore>["categories"],
  growthScore: number
): AuditScore[] {
  const now = new Date().toISOString()

  const scores: AuditScore[] = SCORE_CATEGORY_DEFINITIONS.map((definition) => {
    let score: number | null = null

    if (definition.category === "growth") {
      score = growthScore
    } else if (definition.category in categoryScores) {
      score = categoryScores[definition.category as keyof typeof categoryScores]
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
    const discovered = await mapDiscoveredPages(auditId, session.websiteUrl, fetchContext)

    if (discovered.length === 0) {
      throw new Error(
        "Unable to analyze the homepage. Verify the URL is public and reachable over HTTPS."
      )
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
    await createScores(createScorePlaceholders(auditId))

    const { findings: scoredFindings } = await runAuditRules({
      session: analyzingSession,
      pages: savedPages,
      pageSnapshots,
    })

    const { categories, growthScore } = calculateAuditScore(scoredFindings)

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

    await upsertScores(buildComputedScores(auditId, categories, growthScore))

    await delay(PHASE_DELAYS_MS.finalizing)

    await createHistoryEvent(
      auditId,
      "completed",
      `Audit completed with Growth Score ${growthScore} across ${scoredFindings.length} findings`
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
