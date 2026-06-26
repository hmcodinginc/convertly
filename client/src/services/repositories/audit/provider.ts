import { shouldUseSupabaseAudits } from "@/lib/env"
import { traceNetworkCall } from "@/diagnostics/networkTrace"
import * as localFinding from "@/services/repositories/audit/auditFindingRepository"
import * as localHistory from "@/services/repositories/audit/auditHistoryRepository"
import * as localPage from "@/services/repositories/audit/auditPageRepository"
import * as localScore from "@/services/repositories/audit/auditScoreRepository"
import * as localSession from "@/services/repositories/audit/auditSessionRepository"
import * as supabaseFinding from "@/services/repositories/audit/supabase/auditFindingRepository"
import * as supabaseList from "@/services/repositories/audit/supabase/auditListRepository"
import * as supabaseHistory from "@/services/repositories/audit/supabase/auditHistoryRepository"
import * as supabasePage from "@/services/repositories/audit/supabase/auditPageRepository"
import * as supabaseScore from "@/services/repositories/audit/supabase/auditScoreRepository"
import { deleteAuditLocal } from "@/services/repositories/audit/localDeleteAudit"
import * as supabaseSession from "@/services/repositories/audit/supabase/auditSessionRepository"
import * as supabaseSessionData from "@/services/repositories/audit/supabase/auditSessionDataRepository"
import type {
  AuditFinding,
  AuditHistoryEvent,
  AuditPage,
  AuditScore,
  AuditSession,
  AuditSessionData,
  AuditSessionStatus,
} from "@/types/auditEngine"

export async function createSession(
  userId: string,
  websiteUrl: string
): Promise<AuditSession> {
  if (shouldUseSupabaseAudits()) {
    return supabaseSession.createSession(userId, websiteUrl)
  }
  return localSession.createSession(userId, websiteUrl)
}

export async function getSessionById(id: string): Promise<AuditSession | null> {
  if (shouldUseSupabaseAudits()) {
    return supabaseSession.getSessionById(id)
  }
  return localSession.getSessionById(id)
}

export async function getSessionsByUserId(userId: string): Promise<AuditSession[]> {
  if (shouldUseSupabaseAudits()) {
    return supabaseSession.getSessionsByUserId(userId)
  }
  return localSession.getSessionsByUserId(userId)
}

export async function updateSessionStatus(
  id: string,
  status: AuditSessionStatus,
  errorMessage?: string
): Promise<AuditSession | null> {
  if (shouldUseSupabaseAudits()) {
    return supabaseSession.updateSessionStatus(id, status, errorMessage)
  }
  return localSession.updateSessionStatus(id, status, errorMessage)
}

export async function createPages(pages: AuditPage[]): Promise<AuditPage[]> {
  if (shouldUseSupabaseAudits()) {
    return supabasePage.createPages(pages)
  }
  return localPage.createPages(pages)
}

export async function getPagesByAuditId(auditId: string): Promise<AuditPage[]> {
  if (shouldUseSupabaseAudits()) {
    return supabasePage.getPagesByAuditId(auditId)
  }
  return localPage.getPagesByAuditId(auditId)
}

export async function updatePage(
  id: string,
  patch: Partial<Pick<AuditPage, "title">>
): Promise<AuditPage | null> {
  if (shouldUseSupabaseAudits()) {
    return supabasePage.updatePage(id, patch)
  }
  return localPage.updatePage(id, patch)
}

export async function createFindings(findings: AuditFinding[]): Promise<AuditFinding[]> {
  if (shouldUseSupabaseAudits()) {
    return supabaseFinding.createFindings(findings)
  }
  return localFinding.createFindings(findings)
}

export async function getFindingsByAuditId(auditId: string): Promise<AuditFinding[]> {
  if (shouldUseSupabaseAudits()) {
    return supabaseFinding.getFindingsByAuditId(auditId)
  }
  return localFinding.getFindingsByAuditId(auditId)
}

export async function getFindingsByUserId(userId: string): Promise<AuditFinding[]> {
  if (shouldUseSupabaseAudits()) {
    const findings = await supabaseFinding.getFindingsForUser()
    return findings.map((item) => item.finding)
  }

  const sessions = localSession.getSessionsByUserId(userId)
  return sessions.flatMap((session) => localFinding.getFindingsByAuditId(session.id))
}

export async function getFindingsWithPagePathsForUser(
  userId: string
): Promise<supabaseFinding.FindingWithPagePath[]> {
  if (shouldUseSupabaseAudits()) {
    return supabaseFinding.getFindingsForUser()
  }

  const sessions = localSession.getSessionsByUserId(userId)
  const pagePathById = new Map<string, string>()

  for (const session of sessions) {
    for (const page of localPage.getPagesByAuditId(session.id)) {
      pagePathById.set(page.id, page.path)
    }
  }

  return sessions
    .flatMap((session) => localFinding.getFindingsByAuditId(session.id))
    .map((finding) => ({
      finding,
      pagePath: finding.pageId ? pagePathById.get(finding.pageId) : undefined,
    }))
}

export type AuditListItem = supabaseList.AuditListItem

export async function getAuditListForUser(userId: string): Promise<AuditListItem[]> {
  if (shouldUseSupabaseAudits()) {
    return supabaseList.getAuditListForUser(userId)
  }

  const sessions = localSession.getSessionsByUserId(userId)

  return Promise.all(
    sessions.map(async (session) => {
      const [pages, scores] = await Promise.all([
        localPage.getPagesByAuditId(session.id),
        localScore.getScoresByAuditId(session.id),
      ])

      return {
        session,
        pageCount: pages.length,
        scores,
      }
    })
  )
}

export async function createScores(scores: AuditScore[]): Promise<AuditScore[]> {
  if (shouldUseSupabaseAudits()) {
    return supabaseScore.createScores(scores)
  }
  return localScore.createScores(scores)
}

export async function upsertScores(scores: AuditScore[]): Promise<AuditScore[]> {
  if (shouldUseSupabaseAudits()) {
    return supabaseScore.upsertScores(scores)
  }

  for (const score of scores) {
    const existing = localScore.getScoreByCategory(score.auditId, score.category)
    if (existing) {
      localScore.updateScore(existing.id, score)
    } else {
      localScore.createScore(score)
    }
  }

  return scores
}

export async function getScoresByAuditId(auditId: string): Promise<AuditScore[]> {
  if (shouldUseSupabaseAudits()) {
    return supabaseScore.getScoresByAuditId(auditId)
  }
  return localScore.getScoresByAuditId(auditId)
}

export async function createHistoryEvent(
  auditId: string,
  status: AuditSessionStatus,
  message: string
): Promise<AuditHistoryEvent> {
  if (shouldUseSupabaseAudits()) {
    return supabaseHistory.createHistoryEvent(auditId, status, message)
  }
  return localHistory.createHistoryEvent(auditId, status, message)
}

export async function getHistoryByAuditId(auditId: string): Promise<AuditHistoryEvent[]> {
  if (shouldUseSupabaseAudits()) {
    return supabaseHistory.getHistoryByAuditId(auditId)
  }
  return localHistory.getHistoryByAuditId(auditId)
}

const inflightSessionData = new Map<string, Promise<AuditSessionData | null>>()
const completedSessionCache = new Map<string, AuditSessionData>()

export function clearCompletedAuditCache(auditId?: string): void {
  if (auditId) {
    completedSessionCache.delete(auditId)
    inflightSessionData.delete(auditId)
    return
  }

  completedSessionCache.clear()
  inflightSessionData.clear()
}

export async function getAuditSessionData(auditId: string): Promise<AuditSessionData | null> {
  if (shouldUseSupabaseAudits()) {
    const cached = completedSessionCache.get(auditId)
    if (cached) return cached

    const inflight = inflightSessionData.get(auditId)
    if (inflight) return inflight

    const request = traceNetworkCall(`getAuditSessionData:${auditId}`, () =>
      supabaseSessionData.getAuditSessionDataById(auditId)
    )
      .then((data) => {
        if (
          data &&
          (data.session.status === "completed" || data.session.status === "failed")
        ) {
          completedSessionCache.set(auditId, data)
        }
        return data
      })
      .finally(() => {
        inflightSessionData.delete(auditId)
      })

    inflightSessionData.set(auditId, request)
    return request
  }

  const session = await getSessionById(auditId)
  if (!session) return null

  const [pages, findings, scores, history] = await Promise.all([
    getPagesByAuditId(auditId),
    getFindingsByAuditId(auditId),
    getScoresByAuditId(auditId),
    getHistoryByAuditId(auditId),
  ])

  return { session, pages, findings, scores, history }
}

export async function deleteAudit(auditId: string): Promise<void> {
  if (shouldUseSupabaseAudits()) {
    clearCompletedAuditCache(auditId)
    await supabaseSession.deleteAudit(auditId)
    return
  }

  deleteAuditLocal(auditId)
}
