import { getAuditTypeLabel } from "@/lib/auditTypes"
import { formatAuditDateTime } from "@/lib/formatAuditDateTime"
import type { AuditSessionStatus } from "@/types/auditEngine"
import type { WorkspaceUsage } from "@/types/workspace"
import type {
  AuditEntitlementLedgerSnapshot,
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

export function buildWorkspaceAuditUsageBreakdown(
  sessions: AuditLedgerSourceSession[],
  usage: WorkspaceUsage,
  consumedSnapshots: AuditEntitlementLedgerSnapshot[] = []
): WorkspaceAuditUsageBreakdown {
  const completedCount = sessions.filter((session) => session.status === "completed").length
  const failedCount = sessions.filter((session) => session.status === "failed").length
  const draftCount = sessions.filter((session) => session.status === "draft").length

  const sessionIds = new Set(sessions.map((session) => session.id))

  const ledgerItems = [
    ...sessions.map((session) => ({
      sortAt: session.createdAt,
      row: {
        id: session.id,
        url: session.websiteUrl,
        auditType: getAuditTypeLabel(session.auditType),
        createdAt: formatAuditDateTime(session.createdAt),
        status: toLedgerDisplayStatus(session.status),
        counted: Boolean(session.entitlementConsumedAt),
      } satisfies WorkspaceAuditLedgerRow,
    })),
    ...consumedSnapshots
      .filter((snapshot) => snapshot.auditId === null || !sessionIds.has(snapshot.auditId))
      .map((snapshot) => ({
        sortAt: snapshot.completedAt,
        row: {
          id: snapshot.auditId ?? `ledger-${snapshot.id}`,
          url: snapshot.websiteUrl,
          auditType: getAuditTypeLabel(snapshot.auditType),
          createdAt: formatAuditDateTime(snapshot.completedAt),
          status: "Deleted" as const,
          counted: true,
        } satisfies WorkspaceAuditLedgerRow,
      })),
  ]

  const ledger = ledgerItems
    .sort((a, b) => b.sortAt.localeCompare(a.sortAt))
    .map((item) => item.row)

  const deletedCountedCount = consumedSnapshots.filter(
    (snapshot) => snapshot.auditId === null || !sessionIds.has(snapshot.auditId)
  ).length

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
