import { recentAudits as sampleAudits } from "@/features/dashboard/data/mockData"
import { shouldUseSupabaseAudits } from "@/lib/env"
import { buildAuditListEntryFromSession } from "@/services/audit/auditDetailBuilder"
import { getAuditSessionData } from "@/services/repositories/audit/provider"
import type { Audit } from "@/types/audit"
import { getJson, setJson } from "@/services/storage/localStorageClient"
import { STORAGE_KEYS } from "@/services/storage/keys"

function loadCreatedAudits(): Audit[] {
  return getJson<Audit[]>(STORAGE_KEYS.createdAudits, [])
}

function saveCreatedAudits(audits: Audit[]): void {
  setJson(STORAGE_KEYS.createdAudits, audits)
  setJson(STORAGE_KEYS.hasUserAudits, audits.length > 0)
}

async function hasUserAudits(): Promise<boolean> {
  if (shouldUseSupabaseAudits()) {
    return loadCreatedAudits().length > 0
  }

  return (
    getJson<boolean>(STORAGE_KEYS.hasUserAudits, false) ||
    loadCreatedAudits().length > 0
  )
}

async function getAllAudits(): Promise<Audit[]> {
  const created = loadCreatedAudits()

  if (shouldUseSupabaseAudits()) {
    return created
  }

  const createdIds = new Set(created.map((audit) => audit.id))
  const samples = sampleAudits.filter((audit) => !createdIds.has(audit.id))
  return [...created, ...samples]
}

async function getAuditById(id: string): Promise<Audit | undefined> {
  const stored = (await getAllAudits()).find((audit) => audit.id === id)
  if (stored) return stored

  const sessionData = await getAuditSessionData(id)
  if (!sessionData) return undefined

  return buildAuditListEntryFromSession(sessionData)
}

function createAuditEntry(audit: Audit): Audit {
  const created = loadCreatedAudits()
  saveCreatedAudits([audit, ...created])
  return audit
}

async function syncAuditFromSession(auditId: string): Promise<Audit | null> {
  const sessionData = await getAuditSessionData(auditId)
  if (!sessionData) return null

  const entry = buildAuditListEntryFromSession(sessionData)
  const created = loadCreatedAudits()
  const index = created.findIndex((audit) => audit.id === auditId)

  if (index === -1) {
    saveCreatedAudits([entry, ...created])
    return entry
  }

  const updated = [...created]
  updated[index] = entry
  saveCreatedAudits(updated)
  return entry
}

async function updateAudit(id: string, patch: Partial<Audit>): Promise<Audit | null> {
  const all = await getAllAudits()
  const existing = all.find((audit) => audit.id === id)
  if (!existing) return null

  const updated = { ...existing, ...patch }
  const created = loadCreatedAudits()
  const inCreated = created.some((audit) => audit.id === id)

  if (inCreated) {
    saveCreatedAudits(created.map((audit) => (audit.id === id ? updated : audit)))
  }

  return updated
}

function removeAuditEntry(id: string): void {
  const created = loadCreatedAudits()
  saveCreatedAudits(created.filter((audit) => audit.id !== id))
}

export {
  createAuditEntry,
  getAllAudits,
  getAuditById,
  hasUserAudits,
  removeAuditEntry,
  syncAuditFromSession,
  updateAudit,
}
