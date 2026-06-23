import { getJson, removeItem, setJson } from "@/services/storage/localStorageClient"
import { auditDetailStorageKey, STORAGE_KEYS } from "@/services/storage/keys"
import type {
  AuditFinding,
  AuditHistoryEvent,
  AuditPage,
  AuditScore,
  AuditSession,
} from "@/types/auditEngine"

export function deleteAuditLocal(auditId: string): void {
  setJson(
    STORAGE_KEYS.auditSessions,
    getJson<AuditSession[]>(STORAGE_KEYS.auditSessions, []).filter(
      (session) => session.id !== auditId
    )
  )

  setJson(
    STORAGE_KEYS.auditPages,
    getJson<AuditPage[]>(STORAGE_KEYS.auditPages, []).filter(
      (page) => page.auditId !== auditId
    )
  )

  setJson(
    STORAGE_KEYS.auditFindings,
    getJson<AuditFinding[]>(STORAGE_KEYS.auditFindings, []).filter(
      (finding) => finding.auditId !== auditId
    )
  )

  setJson(
    STORAGE_KEYS.auditScores,
    getJson<AuditScore[]>(STORAGE_KEYS.auditScores, []).filter(
      (score) => score.auditId !== auditId
    )
  )

  setJson(
    STORAGE_KEYS.auditHistory,
    getJson<AuditHistoryEvent[]>(STORAGE_KEYS.auditHistory, []).filter(
      (event) => event.auditId !== auditId
    )
  )

  removeItem(auditDetailStorageKey(auditId))
}
