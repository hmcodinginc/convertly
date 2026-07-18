/** Shared interrupted-audit messaging (client UI + DB watchdog). */
export const AUDIT_INTERRUPTED_MESSAGE =
  "Audit was interrupted. Please run it again."

/** Matches the server-side stale watchdog window (~15 minutes). */
export const AUDIT_STALE_MS = 15 * 60 * 1000

export function isAuditStale(updatedAt: string, nowMs = Date.now()): boolean {
  const updatedMs = Date.parse(updatedAt)
  if (Number.isNaN(updatedMs)) return false
  return nowMs - updatedMs >= AUDIT_STALE_MS
}
