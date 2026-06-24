import { shouldUseSupabaseAudits } from "@/lib/env"
import * as localFinding from "@/services/repositories/audit/auditFindingRepository"
import * as localHistory from "@/services/repositories/audit/auditHistoryRepository"
import * as localPage from "@/services/repositories/audit/auditPageRepository"
import * as localScore from "@/services/repositories/audit/auditScoreRepository"
import * as localSession from "@/services/repositories/audit/auditSessionRepository"
import * as supabaseFinding from "@/services/repositories/audit/supabase/auditFindingRepository"
import * as supabaseHistory from "@/services/repositories/audit/supabase/auditHistoryRepository"
import * as supabasePage from "@/services/repositories/audit/supabase/auditPageRepository"
import * as supabaseScore from "@/services/repositories/audit/supabase/auditScoreRepository"
import { deleteAuditLocal } from "@/services/repositories/audit/localDeleteAudit"
import * as supabaseSession from "@/services/repositories/audit/supabase/auditSessionRepository"
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
    const sessions = await supabaseSession.getSessionsByUserId(userId)
    const findings = await Promise.all(
      sessions.map((session) => supabaseFinding.getFindingsByAuditId(session.id))
    )
    return findings.flat()
  }

  const sessions = localSession.getSessionsByUserId(userId)
  return sessions.flatMap((session) => localFinding.getFindingsByAuditId(session.id))
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

export async function getAuditSessionData(auditId: string): Promise<AuditSessionData | null> {
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
    await supabaseSession.deleteAudit(auditId)
    return
  }

  deleteAuditLocal(auditId)
}
