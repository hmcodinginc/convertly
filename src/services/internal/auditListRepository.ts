import { recentAudits as sampleAudits } from "@/features/dashboard/data/mockData"
import type { Audit } from "@/types/audit"
import { getJson, setJson } from "@/services/storage/localStorageClient"
import { STORAGE_KEYS } from "@/services/storage/keys"

function loadCreatedAudits(): Audit[] {
  return getJson<Audit[]>(STORAGE_KEYS.createdAudits, [])
}

function saveCreatedAudits(audits: Audit[]): void {
  setJson(STORAGE_KEYS.createdAudits, audits)
  if (audits.length > 0) {
    setJson(STORAGE_KEYS.hasUserAudits, true)
  }
}

function hasUserAudits(): boolean {
  return (
    getJson<boolean>(STORAGE_KEYS.hasUserAudits, false) ||
    loadCreatedAudits().length > 0
  )
}

function getAllAudits(): Audit[] {
  const created = loadCreatedAudits()
  const createdIds = new Set(created.map((a) => a.id))
  const samples = sampleAudits.filter((a) => !createdIds.has(a.id))
  return [...created, ...samples]
}

function getAuditById(id: string): Audit | undefined {
  return getAllAudits().find((a) => a.id === id)
}

function parseDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`)
    return parsed.hostname.replace(/^www\./, "")
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0] ?? url
  }
}

function isValidAuditUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`)
    return Boolean(parsed.hostname.includes("."))
  } catch {
    return false
  }
}

function createAuditFromUrl(url: string): Audit {
  const id = `audit-${Date.now()}`
  const domain = parseDomainFromUrl(url)
  const name = `${domain} · Full funnel`

  const audit: Audit = {
    id,
    name,
    domain,
    completedAt: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    pagesScanned: 24,
    conversionScore: 68,
    status: "Completed",
  }

  const created = loadCreatedAudits()
  saveCreatedAudits([audit, ...created])
  return audit
}

function updateAudit(id: string, patch: Partial<Audit>): Audit | null {
  const all = getAllAudits()
  const existing = all.find((a) => a.id === id)
  if (!existing) return null

  const updated = { ...existing, ...patch }
  const created = loadCreatedAudits()
  const inCreated = created.some((a) => a.id === id)

  if (inCreated) {
    saveCreatedAudits(created.map((a) => (a.id === id ? updated : a)))
  }

  return updated
}

export {
  createAuditFromUrl,
  getAllAudits,
  getAuditById,
  hasUserAudits,
  isValidAuditUrl,
  parseDomainFromUrl,
  updateAudit,
}
