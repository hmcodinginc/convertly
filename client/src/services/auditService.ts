import { getRecommendationPlaybook as resolvePlaybook } from "@/features/audits/data/auditPlaybooks"
import type { PlaybookBuildInput } from "@/services/audit/playbooks/buildRecommendationPlaybook"
import { auditDetailsMap } from "@/features/audits/data/auditDetails"
import {
  buildAuditDetailFromSession,
  buildAuditListEntryFromSession,
  buildAuditListEntryFromSummary,
} from "@/services/audit/auditDetailBuilder"
import { resolveStoredAuditType } from "@/lib/auditTypes"
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
  getDraftSessionsByUserId,
  getSessionById,
  updateSessionFields,
  updateSessionStatus,
} from "@/services/repositories/audit/provider"
import { getLedgerSnapshotsForUser } from "@/services/repositories/audit/auditEntitlementLedgerRepository"
import {
  clearCompletedAuditDetail,
  getCompletedAuditDetail,
  setCompletedAuditDetail,
} from "@/lib/completedAuditCache"
import { getCachedAuthSession } from "@/lib/authSessionCache"
import { isDeletableAudit, isSampleAuditId } from "@/lib/auditHistoryUtils"
import { applyScoreDeltaFromHistory } from "@/services/audit/utils/auditScoreHistory"
import { shouldUseSupabaseAudits } from "@/lib/env"
import { AUDIT_INTERRUPTED_MESSAGE } from "@/lib/auditReliability"
import { validateAuditUrl } from "@/lib/auditUrlValidation"
import { getSupabaseClient } from "@/services/auth/supabaseClient"
import { AuditLimitError } from "@/types/billing"
import { ensureBusinessFoundation } from "@/services/businessBootstrapService"
import {
  assertCanRunAudit,
} from "@/services/entitlementService"
import { recordAuditForDomain } from "@/services/workspaceService"
import { isAuditSessionStatus } from "@/lib/auditStatus"
import type {
  Audit,
  AuditDetail,
  CreateAuditInput,
  Recommendation,
  RecommendationPlaybook,
} from "@/types/audit"
import type { AuditDraft, SaveAuditDraftInput } from "@/types/auditDraft"
import type { AuditSession, AuditSessionData, AuditSessionStatus } from "@/types/auditEngine"
import type { DashboardMetric, OpportunityItem } from "@/types/dashboard"
import type {
  AuditEntitlementLedgerSnapshot,
  AuditLedgerSourceSession,
} from "@/types/workspaceUsageBreakdown"

const SAMPLE_AUDIT_ID = "audit-1"

/**
 * The database is authoritative for audit-start entitlement (atomic trigger).
 * Map its raised errors to the client-facing AuditLimitError.
 */
function rethrowAuditStartError(error: unknown): never {
  const message = error instanceof Error ? error.message : ""

  if (message.includes("AUDIT_LIMIT_REACHED")) {
    throw new AuditLimitError("You have used all audits included in your plan.")
  }
  if (message.includes("AUDIT_SUBSCRIPTION_INACTIVE")) {
    throw new AuditLimitError("Your subscription is not active.")
  }
  if (message.includes("AUDIT_SUBSCRIPTION_MISSING")) {
    throw new AuditLimitError("Subscription not found. Visit billing to restore audit access.")
  }

  throw error instanceof Error ? error : new Error("Unable to start audit. Please try again.")
}

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
  await sweepStaleAuditsForCurrentUser()
  const userId = await resolveUserId()
  return loadUserAudits(userId)
}

/**
 * Marks the current user's stale non-terminal audits as failed.
 * Best-effort; never throws to callers.
 */
export async function sweepStaleAuditsForCurrentUser(): Promise<void> {
  if (!shouldUseSupabaseAudits()) return

  try {
    const supabase = getSupabaseClient()
    await supabase.rpc("fail_my_stale_audits")
  } catch {
    // Watchdog is best-effort — listing audits must still succeed.
  }
}

/**
 * Persist interrupted status for a specific audit when the client detects staleness.
 */
export async function markAuditInterrupted(auditId: string): Promise<void> {
  if (!shouldUseSupabaseAudits()) return

  try {
    await createHistoryEvent(auditId, "failed", AUDIT_INTERRUPTED_MESSAGE)
  } catch {
    // Continue to status write.
  }

  try {
    await updateSessionStatus(auditId, "failed", AUDIT_INTERRUPTED_MESSAGE)
  } catch {
    // Stale watchdog / RPC sweep will still reclaim this row.
  }
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

  const auditType = resolveStoredAuditType(input.auditType)

  let workspaceId: string | undefined

  if (shouldUseSupabaseAudits()) {
    await assertCanRunAudit(userId)
    workspaceId = await ensureBusinessFoundation(userId)
  }

  let auditSession: AuditSession

  if (input.draftId) {
    const existing = await getSessionById(input.draftId)
    if (!existing || existing.status !== "draft" || existing.userId !== userId) {
      throw new Error("Draft not found.")
    }

    // The restart reuses the draft's row id — drop any detail cached under it.
    invalidateCompletedAuditDetail(input.draftId)

    let updated: AuditSession | null
    try {
      updated = await updateSessionFields(input.draftId, {
        websiteUrl: validation.sanitizedUrl,
        auditType,
        status: "pending",
        errorMessage: null,
      })
    } catch (error) {
      rethrowAuditStartError(error)
    }

    if (!updated) {
      throw new Error("Unable to start audit from draft.")
    }

    auditSession = updated
  } else {
    try {
      auditSession = await createSession(
        userId,
        validation.sanitizedUrl,
        workspaceId,
        { auditType }
      )
    } catch (error) {
      rethrowAuditStartError(error)
    }
  }

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

export async function saveAuditDraft(input: SaveAuditDraftInput): Promise<AuditDraft> {
  const userId = await resolveUserId()
  const validation = await validateAuditUrl(input.url)
  if (!validation.valid) {
    throw new Error(validation.errors[0] ?? "Enter a valid website URL")
  }

  const auditType = resolveStoredAuditType(input.auditType)

  if (!shouldUseSupabaseAudits()) {
    throw new Error("Draft audits require Supabase.")
  }

  const workspaceId = await ensureBusinessFoundation(userId)

  if (input.draftId) {
    const existing = await getSessionById(input.draftId)
    if (!existing || existing.status !== "draft" || existing.userId !== userId) {
      throw new Error("Draft not found.")
    }

    const updated = await updateSessionFields(input.draftId, {
      websiteUrl: validation.sanitizedUrl,
      auditType,
      status: "draft",
    })

    if (!updated) {
      throw new Error("Unable to update draft.")
    }

    return mapSessionToDraft(updated)
  }

  const draftSession = await createSession(userId, validation.sanitizedUrl, workspaceId, {
    status: "draft",
    auditType,
  })

  await createHistoryEvent(draftSession.id, "draft", "Audit draft saved")

  return mapSessionToDraft(draftSession)
}

export async function getAuditDrafts(): Promise<AuditDraft[]> {
  const userId = await resolveUserId()
  const drafts = await getDraftSessionsByUserId(userId)
  return drafts.map(mapSessionToDraft)
}

function mapSessionToDraft(session: AuditSession): AuditDraft {
  const auditType = resolveStoredAuditType(session.auditType)

  return {
    id: session.id,
    websiteUrl: session.websiteUrl,
    auditType,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  }
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

export async function getAuditLedgerSourceSessions(): Promise<AuditLedgerSourceSession[]> {
  await delay()
  const userId = await resolveUserId()

  if (shouldUseSupabaseAudits()) {
    const listItems = await getAuditListForUser(userId)
    return listItems.map((item) => ({
      id: item.session.id,
      websiteUrl: item.session.websiteUrl,
      auditType: resolveStoredAuditType(item.session.auditType),
      createdAt: item.session.createdAt,
      status: item.session.status,
      entitlementConsumedAt: item.session.entitlementConsumedAt ?? null,
    }))
  }

  const audits = await auditListRepository.getAllAudits()
  return audits.map((audit) => ({
    id: audit.id,
    websiteUrl: audit.websiteUrl ?? audit.domain,
    auditType: resolveStoredAuditType("full-funnel"),
    createdAt: audit.completedAt,
    status: mapLocalAuditStatus(audit.status),
    entitlementConsumedAt: audit.status === "Completed" ? audit.completedAt : null,
  }))
}

export async function getAuditEntitlementLedgerSnapshots(): Promise<
  AuditEntitlementLedgerSnapshot[]
> {
  await delay()
  const userId = await resolveUserId()

  if (!shouldUseSupabaseAudits()) {
    return []
  }

  return getLedgerSnapshotsForUser(userId)
}

function mapLocalAuditStatus(status: Audit["status"]): AuditSessionStatus {
  if (isAuditSessionStatus(status)) return status
  if (status === "Completed") return "completed"
  if (status === "Running") return "analyzing"
  return "pending"
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
