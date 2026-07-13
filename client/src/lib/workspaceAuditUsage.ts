import { getAuditTypeLabel } from "@/lib/auditTypes"
import { formatAuditDateTime } from "@/lib/formatAuditDateTime"
import type { AuditSessionStatus } from "@/types/auditEngine"
import type { WorkspaceUsage } from "@/types/workspace"
import type {
  AuditLedgerSourceSession,
  WorkspaceAuditLedgerRow,
  WorkspaceAuditUsageBreakdown,
  WorkspaceLedgerDisplayStatus,
} from "@/types/workspaceUsageBreakdown"

function formatPeriodEnd(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatShortRenewalDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  })
}

function toLedgerDisplayStatus(status: AuditSessionStatus): WorkspaceLedgerDisplayStatus {
  if (status === "completed") return "Completed"
  if (status === "failed") return "Failed"
  if (status === "draft") return "Draft"
  if (status === "pending") return "Pending"
  if (status === "crawling" || status === "analyzing") return "Running"
  return "Pending"
}

function isCountedLedgerStatus(status: WorkspaceLedgerDisplayStatus): boolean {
  return status === "Completed" || status === "Deleted"
}

function buildDeletedLedgerRows(count: number): WorkspaceAuditLedgerRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `deleted-counted-${index}`,
    url: "Unavailable — audit was removed",
    auditType: "—",
    createdAt: "—",
    status: "Deleted" as const,
    counted: true,
  }))
}

export function buildWorkspaceAuditUsageBreakdown(
  sessions: AuditLedgerSourceSession[],
  usage: WorkspaceUsage
): WorkspaceAuditUsageBreakdown {
  const completedCount = sessions.filter((session) => session.status === "completed").length
  const failedCount = sessions.filter((session) => session.status === "failed").length
  const draftCount = sessions.filter((session) => session.status === "draft").length

  const ledger: WorkspaceAuditLedgerRow[] = [...sessions]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((session) => {
      const status = toLedgerDisplayStatus(session.status)

      return {
        id: session.id,
        url: session.websiteUrl,
        auditType: getAuditTypeLabel(session.auditType),
        createdAt: formatAuditDateTime(session.createdAt),
        status,
        counted: isCountedLedgerStatus(status),
      }
    })

  const countedInLedger = ledger.filter((row) => row.counted).length
  const deletedCountedCount = Math.max(0, usage.auditsUsed - countedInLedger)

  if (deletedCountedCount > 0) {
    ledger.push(...buildDeletedLedgerRows(deletedCountedCount))
  }

  return {
    completedCount,
    failedCount,
    draftCount,
    remaining: usage.auditsRemaining,
    periodEndFormatted: formatPeriodEnd(usage.periodEnd),
    renewalDateShort: formatShortRenewalDate(usage.periodEnd),
    deletedCountedCount,
    ledger,
  }
}

export function getWorkspaceLedgerStatusVariant(
  status: WorkspaceLedgerDisplayStatus
): "success" | "danger" | "neutral" | "accent" | "warning" {
  switch (status) {
    case "Completed":
      return "success"
    case "Failed":
      return "danger"
    case "Draft":
      return "neutral"
    case "Deleted":
      return "warning"
    case "Running":
      return "accent"
    case "Pending":
    default:
      return "neutral"
  }
}
