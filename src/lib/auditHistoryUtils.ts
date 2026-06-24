import { auditDetailsMap } from "@/features/audits/data/auditDetails"
import { getAuditStatusLabel } from "@/lib/auditStatus"
import type { Audit, AuditStatus } from "@/types/audit"
import type { AuditSessionStatus } from "@/types/auditEngine"

const SAMPLE_AUDIT_IDS = new Set(["audit-1", "audit-2", "audit-3", "audit-4"])

const SESSION_STATUS_OPTIONS: AuditSessionStatus[] = [
  "pending",
  "crawling",
  "analyzing",
  "completed",
  "failed",
]

const LEGACY_STATUS_OPTIONS: Extract<AuditStatus, "Completed" | "Running" | "Scheduled">[] = [
  "Completed",
  "Running",
  "Scheduled",
]

export type AuditStatusFilter = AuditStatus | "all"

export const AUDIT_STATUS_FILTER_OPTIONS: { value: AuditStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  ...SESSION_STATUS_OPTIONS.map((status) => ({
    value: status as AuditStatusFilter,
    label: getAuditStatusLabel(status),
  })),
  ...LEGACY_STATUS_OPTIONS.map((status) => ({
    value: status,
    label: getAuditStatusLabel(status),
  })),
]

export function isDeletableAudit(id: string): boolean {
  if (SAMPLE_AUDIT_IDS.has(id)) return false
  if (id in auditDetailsMap) return false
  return true
}

export function isSampleAuditId(id: string): boolean {
  return SAMPLE_AUDIT_IDS.has(id) || id in auditDetailsMap
}

export function matchesAuditSearch(audit: Audit, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  const websiteUrl = (audit.websiteUrl ?? "").toLowerCase()
  const domain = audit.domain.toLowerCase()

  return websiteUrl.includes(normalized) || domain.includes(normalized)
}

export function matchesAuditStatusFilter(
  audit: Audit,
  statusFilter: AuditStatusFilter
): boolean {
  if (statusFilter === "all") return true
  return audit.status === statusFilter
}

export function filterAudits(
  audits: Audit[],
  options: { searchQuery: string; statusFilter: AuditStatusFilter }
): Audit[] {
  return audits.filter(
    (audit) =>
      matchesAuditSearch(audit, options.searchQuery) &&
      matchesAuditStatusFilter(audit, options.statusFilter)
  )
}

function escapeCsvValue(value: string | number): string {
  const text = String(value)
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function exportAuditsToCsv(audits: Audit[]): void {
  const headers = ["Name", "Website URL", "Domain", "Date", "Score", "Status", "Pages"]
  const rows = audits.map((audit) => [
    audit.name,
    audit.websiteUrl ?? audit.domain,
    audit.domain,
    audit.completedAt,
    audit.conversionScore,
    getAuditStatusLabel(audit.status),
    audit.pagesScanned,
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `convertly-audits-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
