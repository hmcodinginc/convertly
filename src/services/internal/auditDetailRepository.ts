import {
  auditDetailsMap,
  buildAuditDetailFromAudit,
} from "@/features/audits/data/auditDetails"
import type { AuditDetail } from "@/types/audit"
import { auditDetailStorageKey } from "@/services/storage/keys"
import { getItem, removeItem, setItem } from "@/services/storage/localStorageClient"

function getCachedAuditDetail(id: string): AuditDetail | null {
  const stored = getItem(auditDetailStorageKey(id))
  if (!stored) return null

  try {
    return JSON.parse(stored) as AuditDetail
  } catch {
    return null
  }
}

function getAuditDetail(id: string): AuditDetail | null {
  if (id in auditDetailsMap) {
    return auditDetailsMap[id]
  }

  return getCachedAuditDetail(id)
}

function saveAuditDetail(detail: AuditDetail): void {
  setItem(auditDetailStorageKey(detail.id), JSON.stringify(detail))
}

function createAuditDetail(id: string, name: string, domain: string): AuditDetail {
  const detail = buildAuditDetailFromAudit(id, name, domain)
  saveAuditDetail(detail)
  return detail
}

function removeAuditDetail(id: string): void {
  delete auditDetailsMap[id]
  removeItem(auditDetailStorageKey(id))
}

export {
  createAuditDetail,
  getAuditDetail,
  getCachedAuditDetail,
  removeAuditDetail,
  saveAuditDetail,
}
