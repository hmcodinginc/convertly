import {
  auditDetailsMap,
  buildAuditDetailFromAudit,
  enrichAuditDetail,
} from "@/features/audits/data/auditDetails"
import type { AuditDetail } from "@/types/audit"
import { auditDetailStorageKey } from "@/services/storage/keys"
import { getItem, removeItem, setItem } from "@/services/storage/localStorageClient"

function getAuditDetail(
  id: string,
  fallback?: { name: string; domain: string }
): AuditDetail | null {
  if (auditDetailsMap[id]) {
    return auditDetailsMap[id]
  }

  const stored = getItem(auditDetailStorageKey(id))
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as AuditDetail
      if (!parsed.scoreBreakdown?.length) {
        return enrichAuditDetail(parsed)
      }
      return parsed
    } catch {
      /* use fallback below */
    }
  }

  if (fallback) {
    return buildAuditDetailFromAudit(id, fallback.name, fallback.domain)
  }

  return null
}

function saveAuditDetail(detail: AuditDetail): void {
  auditDetailsMap[detail.id] = detail
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

export { createAuditDetail, getAuditDetail, removeAuditDetail, saveAuditDetail }
