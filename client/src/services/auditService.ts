import { getRecommendationPlaybook as resolvePlaybook } from "@/features/audits/data/auditPlaybooks"
import type { PlaybookBuildInput } from "@/services/audit/playbooks/buildRecommendationPlaybook"
import { auditDetailsMap } from "@/features/audits/data/auditDetails"
import {
  buildAuditDetailFromSession,
  buildAuditListEntryFromSession,
  buildAuditListEntryFromSummary,
} from "@/services/audit/auditDetailBuilder"
import {
  buildDashboardBundle,
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
  clearCompletedAuditCache,
  createHistoryEvent,
  createSession,
  deleteAudit as deleteAuditRecord,
  getAuditListForUser,
  getAuditSessionData,
  getSessionById,
} from "@/services/repositories/audit/provider"
import {
  clearCompletedAuditDetail,
  getCompletedAuditDetail,
  setCompletedAuditDetail,
} from "@/lib/completedAuditCache"
import { getCachedAuthSession } from "@/lib/authSessionCache"
import { isDeletableAudit, isSampleAuditId } from "@/lib/auditHistoryUtils"
import { applyScoreDeltaFromHistory } from "@/services/audit/utils/auditScoreHistory"
import { shouldUseSupabaseAudits } from "@/lib/env"
import { validateAuditUrl } from "@/lib/auditUrlValidation"
import { AuditLimitError } from "@/types/billing"
import { ensureBusinessFoundation } from "@/services/businessBootstrapService"
import {
  assertCanRunAudit,
  consumeAuditEntitlement,
} from "@/services/entitlementService"
import { recordAuditForDomain } from "@/services/workspaceService"
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
  const session = getCachedAuthSession() ?? (await authService.getSession())
  return session?.userId ?? "anonymous"
}

async function loadUserAudits(userId: string): Promise<Audit[]> {
  if (shouldUseSupabaseAudits()) {
    const listItems = await getAuditListForUser(userId)
    return listItems.map((item) =>
      buildAuditListEntryFromSummary(item.session, item.pageCount, item.scores)
    )
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
    return (await auditListRepository.getAuditById(id)) ?? null
  }

  if (id === SAMPLE_AUDIT_ID || auditDetailsMap[id]) {
    return (await auditListRepository.getAuditById(id)) ?? null
  }

  const sessionData = await getAuditSessionData(id)
  if (sessionData) {
    return buildAuditListEntryFromSession(sessionData)
  }

  return (await auditListRepository.getAuditById(id)) ?? null
}

export function invalidateCompletedAuditDetail(id: string): void {
  clearCompletedAuditDetail(id)
  clearCompletedAuditCache(id)
}

export async function getAuditDetail(id: string): Promise<AuditDetail | null> {
  await delay()

  if (isSampleAuditId(id)) {
    return auditDetailsMap[id] ?? null
  }

  const cachedDetail = getCompletedAuditDetail(id)
  if (cachedDetail) return cachedDetail

  const sessionData = await getAuditSessionData(id)
  if (sessionData) {
    let detail = buildAuditDetailFromSession(sessionData)
    const audits = await getAudits()
    detail = applyScoreDeltaFromHistory(detail, audits)
    setCompletedAuditDetail(detail)
    if (!shouldUseSupabaseAudits()) {
      auditDetailRepository.saveAuditDetail(detail)
    }
    return detail
  }

  return auditDetailRepository.getCachedAuditDetail(id)
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

  let workspaceId: string | undefined

  if (shouldUseSupabaseAudits()) {
    await assertCanRunAudit(userId)
    workspaceId = await ensureBusinessFoundation(userId)
    await consumeAuditEntitlement(userId)
  }

  const auditSession = await createSession(userId, validation.sanitizedUrl, workspaceId)

  if (shouldUseSupabaseAudits()) {
    void recordAuditForDomain(userId, validation.sanitizedUrl)
  }

  await createHistoryEvent(auditSession.id, "pending", "Audit session created")

  const listEntry = buildAuditListEntryFromSummary(auditSession, 0, [])

  if (!shouldUseSupabaseAudits()) {
    auditListRepository.createAuditEntry(listEntry)
  }

  startAuditEngine(auditSession.id)

  return listEntry
}

/**
 * Shared audit run workflow: create session, start engine, poll until complete/failed.
 * Used by New Audit and Re-audit (via New Audit auto-start).
 */
export async function runAuditWorkflow(
  sanitizedUrl: string,
  options?: {
    onStatus?: (status: AuditSessionStatus) => void
  }
): Promise<{ audit: Audit; finalStatus: AuditSessionStatus; errorMessage?: string }> {
  const audit = await createAudit({ url: sanitizedUrl })
  const finalStatus = await waitForAuditCompletion(audit.id, {
    onStatus: options?.onStatus,
  })

  const session = await getSessionById(audit.id)
  return {
    audit,
    finalStatus,
    errorMessage: session?.errorMessage ?? undefined,
  }
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
  options?: {
    intervalMs?: number
    onStatus?: (status: AuditSessionStatus) => void
  }
): Promise<AuditSessionStatus> {
  const intervalMs = options?.intervalMs ?? 750

  return new Promise((resolve, reject) => {
    const poll = async () => {
      const session = await getSessionById(id)

      if (!session) {
        reject(new Error("Audit session not found"))
        return
      }

      options?.onStatus?.(session.status)

      if (
        !shouldUseSupabaseAudits() &&
        (session.status === "completed" || session.status === "failed")
      ) {
        await auditListRepository.syncAuditFromSession(id)
      }

      if (session.status === "completed" || session.status === "failed") {
        resolve(session.status)
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
  invalidateCompletedAuditDetail(id)
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

export async function getDashboardData() {
  await delay()
  const userId = await resolveUserId()
  return buildDashboardBundle(userId)
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

export { AuditLimitError } from "@/types/billing"

export async function getRecommendationPlaybook(
  recommendationId: string,
  options: Omit<PlaybookBuildInput, "recommendationId"> = {}
): Promise<RecommendationPlaybook> {
  await delay()
  return resolvePlaybook(recommendationId, options)
}
