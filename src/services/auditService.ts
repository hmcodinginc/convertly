import { getRecommendationPlaybook as resolvePlaybook } from "@/features/audits/data/auditPlaybooks"
import { auditDetailsMap } from "@/features/audits/data/auditDetails"
import {
  buildAuditDetailFromSession,
  buildAuditListEntryFromSession,
} from "@/services/audit/auditDetailBuilder"
import {
  buildDashboardMetrics,
  buildDashboardRecommendations,
  buildOpportunityQueue,
  userHasAudits as userHasAuditsForUser,
} from "@/services/audit/dashboardAnalytics"
import { startAuditEngine } from "@/services/audit/auditEngine"
import { delay } from "@/services/internal/delay"
import * as auditDetailRepository from "@/services/internal/auditDetailRepository"
import * as auditListRepository from "@/services/internal/auditListRepository"
import * as authService from "@/services/authService"
import {
  createHistoryEvent,
  createSession,
  deleteAudit as deleteAuditRecord,
  getAuditSessionData,
  getSessionById,
  getSessionsByUserId,
} from "@/services/repositories/audit/provider"
import { isDeletableAudit } from "@/lib/auditHistoryUtils"
import { shouldUseSupabaseAudits } from "@/lib/env"
import { validateAuditUrl } from "@/lib/auditUrlValidation"
import type {
  Audit,
  AuditDetail,
  CreateAuditInput,
  Recommendation,
  RecommendationPlaybook,
} from "@/types/audit"
import type { AuditSession, AuditSessionData, AuditSessionStatus } from "@/types/auditEngine"
import type { DashboardMetric, OpportunityItem } from "@/types/dashboard"

const SAMPLE_AUDIT_ID = "audit-1"

async function resolveUserId(): Promise<string> {
  const session = await authService.getSession()
  return session?.userId ?? "anonymous"
}

async function loadUserAudits(userId: string): Promise<Audit[]> {
  if (shouldUseSupabaseAudits()) {
    const sessions = await getSessionsByUserId(userId)
    const audits: Audit[] = []

    for (const session of sessions) {
      const data = await getAuditSessionData(session.id)
      if (data) {
        audits.push(buildAuditListEntryFromSession(data))
      }
    }

    return audits
  }

  return auditListRepository.getAllAudits()
}

export async function getAudits(): Promise<Audit[]> {
  await delay()
  const userId = await resolveUserId()
  return loadUserAudits(userId)
}

export async function getAuditById(id: string): Promise<Audit | null> {
  await delay()

  if (!shouldUseSupabaseAudits() && id.startsWith("audit-") && id !== SAMPLE_AUDIT_ID) {
    return auditListRepository.getAuditById(id) ?? null
  }

  if (id === SAMPLE_AUDIT_ID || auditDetailsMap[id]) {
    return auditListRepository.getAuditById(id) ?? null
  }

  const sessionData = await getAuditSessionData(id)
  if (sessionData) {
    return buildAuditListEntryFromSession(sessionData)
  }

  return auditListRepository.getAuditById(id) ?? null
}

export async function getAuditDetail(id: string): Promise<AuditDetail | null> {
  await delay()

  if (auditDetailsMap[id]) {
    return auditDetailsMap[id]
  }

  const sessionData = await getAuditSessionData(id)
  if (sessionData) {
    const detail = buildAuditDetailFromSession(sessionData)
    auditDetailRepository.saveAuditDetail(detail)
    return detail
  }

  const summary = await auditListRepository.getAuditById(id)
  return auditDetailRepository.getAuditDetail(
    id,
    summary ? { name: summary.name, domain: summary.domain } : undefined
  )
}

export { SAMPLE_AUDIT_ID }

export async function getSampleAuditDetail(): Promise<AuditDetail | null> {
  return getAuditDetail(SAMPLE_AUDIT_ID)
}

export async function createAudit(input: CreateAuditInput): Promise<Audit> {
  const userId = await resolveUserId()

  const validation = await validateAuditUrl(input.url)
  if (!validation.valid) {
    throw new Error(validation.errors[0] ?? "Invalid audit URL")
  }

  const auditSession = await createSession(userId, validation.sanitizedUrl)

  await createHistoryEvent(auditSession.id, "pending", "Audit session created")

  const listEntry = buildAuditListEntryFromSession({
    session: auditSession,
    pages: [],
    findings: [],
    scores: [],
    history: await getAuditSessionData(auditSession.id).then((data) => data?.history ?? []),
  })

  if (!shouldUseSupabaseAudits()) {
    auditListRepository.createAuditEntry(listEntry)
  }

  startAuditEngine(auditSession.id)

  return listEntry
}

export async function getAuditSession(id: string): Promise<AuditSession | null> {
  await delay(0)
  return getSessionById(id)
}

export async function getAuditSessionDataById(id: string): Promise<AuditSessionData | null> {
  await delay(0)
  return getAuditSessionData(id)
}

export async function waitForAuditCompletion(
  id: string,
  options?: { intervalMs?: number; timeoutMs?: number }
): Promise<AuditSessionStatus> {
  const intervalMs = options?.intervalMs ?? 500
  const timeoutMs = options?.timeoutMs ?? 120_000
  const startedAt = Date.now()

  return new Promise((resolve, reject) => {
    const poll = async () => {
      const session = await getSessionById(id)

      if (!session) {
        reject(new Error("Audit session not found"))
        return
      }

      if (!shouldUseSupabaseAudits()) {
        await auditListRepository.syncAuditFromSession(id)
      }

      if (session.status === "completed" || session.status === "failed") {
        resolve(session.status)
        return
      }

      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error("Audit timed out"))
        return
      }

      window.setTimeout(() => void poll(), intervalMs)
    }

    void poll()
  })
}

export async function updateAudit(
  id: string,
  patch: Partial<Audit>
): Promise<Audit | null> {
  await delay()
  return auditListRepository.updateAudit(id, patch)
}

export async function deleteAudit(id: string): Promise<void> {
  if (!isDeletableAudit(id)) {
    throw new Error("This audit cannot be deleted.")
  }

  const session = await getSessionById(id)
  if (!session && !shouldUseSupabaseAudits()) {
    const existing = await auditListRepository.getAuditById(id)
    if (!existing) {
      throw new Error("Audit not found.")
    }
  }

  await deleteAuditRecord(id)
  auditListRepository.removeAuditEntry(id)
  auditDetailRepository.removeAuditDetail(id)
}

export async function hasUserAudits(): Promise<boolean> {
  await delay()
  const userId = await resolveUserId()
  return userHasAuditsForUser(userId)
}

export async function isValidAuditUrl(url: string): Promise<boolean> {
  const validation = await validateAuditUrl(url)
  return validation.valid
}

export async function validateAuditUrlInput(url: string) {
  return validateAuditUrl(url)
}

export async function getDashboardMetrics(): Promise<DashboardMetric[]> {
  await delay()
  const userId = await resolveUserId()
  return buildDashboardMetrics(userId)
}

export async function getOpportunityQueue(): Promise<OpportunityItem[]> {
  await delay()
  const userId = await resolveUserId()
  return buildOpportunityQueue(userId)
}

export async function getDashboardRecommendations(): Promise<Recommendation[]> {
  await delay()
  const userId = await resolveUserId()
  return buildDashboardRecommendations(userId)
}

export async function getRecommendationPlaybook(
  recommendationId: string
): Promise<RecommendationPlaybook> {
  await delay()
  return resolvePlaybook(recommendationId)
}
