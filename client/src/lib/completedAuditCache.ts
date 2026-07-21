import type { AuditDetail } from "@/types/audit"

const completedDetailCache = new Map<string, AuditDetail>()

export function getCompletedAuditDetail(id: string): AuditDetail | null {
  return completedDetailCache.get(id) ?? null
}

export function setCompletedAuditDetail(detail: AuditDetail): void {
  // Only completed audits are immutable. Draft and failed rows can be
  // restarted under the same id, so caching them serves stale reports.
  if (detail.status === "completed" || detail.status === "Completed") {
    completedDetailCache.set(detail.id, detail)
  }
}

export function clearCompletedAuditDetail(id?: string): void {
  if (id) {
    completedDetailCache.delete(id)
    return
  }
  completedDetailCache.clear()
}
