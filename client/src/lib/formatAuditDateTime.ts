const AUDIT_DATETIME_LOCALE = "en-US"

/**
 * Preferred audit timestamp format: Jul 7, 2026 • 01:17 PM
 */
export function formatAuditDateTime(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "—"

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  const datePart = date.toLocaleDateString(AUDIT_DATETIME_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const timePart = date.toLocaleTimeString(AUDIT_DATETIME_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })

  return `${datePart} • ${timePart}`
}

/**
 * Human-readable duration between two ISO timestamps (e.g. 2m 18s).
 */
export function formatAuditDuration(
  startIso: string | null | undefined,
  endIso: string | null | undefined
): string | null {
  if (!startIso || !endIso) return null

  const start = new Date(startIso)
  const end = new Date(endIso)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null

  const totalSeconds = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000))
  if (totalSeconds === 0) return "0s"

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }

  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
  }

  return `${seconds}s`
}
