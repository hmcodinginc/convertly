import type { AuditHistoryEvent, AuditSessionStatus } from "@/types/auditEngine"
import { getJson, setJson } from "@/services/storage/localStorageClient"
import { STORAGE_KEYS } from "@/services/storage/keys"

function loadHistory(): AuditHistoryEvent[] {
  return getJson<AuditHistoryEvent[]>(STORAGE_KEYS.auditHistory, [])
}

function saveHistory(events: AuditHistoryEvent[]): void {
  setJson(STORAGE_KEYS.auditHistory, events)
}

function createHistoryEvent(
  auditId: string,
  status: AuditSessionStatus,
  message: string
): AuditHistoryEvent {
  const event: AuditHistoryEvent = {
    id: `history-${crypto.randomUUID()}`,
    auditId,
    status,
    message,
    createdAt: new Date().toISOString(),
  }

  const events = loadHistory()
  saveHistory([event, ...events])
  return event
}

function getHistoryByAuditId(auditId: string): AuditHistoryEvent[] {
  return loadHistory()
    .filter((event) => event.auditId === auditId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export { createHistoryEvent, getHistoryByAuditId }
