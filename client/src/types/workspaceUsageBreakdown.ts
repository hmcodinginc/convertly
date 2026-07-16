import type { AuditSessionStatus } from "@/types/auditEngine"

export type WorkspaceLedgerDisplayStatus =
  | "Completed"
  | "Failed"
  | "Draft"
  | "Running"
  | "Pending"
  | "Deleted"

export type WorkspaceAuditLedgerRow = {
  id: string
  url: string
  auditType: string
  createdAt: string
  status: WorkspaceLedgerDisplayStatus
  counted: boolean
}

export type WorkspaceAuditUsageBreakdown = {
  completedCount: number
  failedCount: number
  draftCount: number
  remaining: number
  periodEndFormatted: string | null
  renewalDateShort: string | null
  deletedCountedCount: number
  ledger: WorkspaceAuditLedgerRow[]
}

export type AuditLedgerSourceSession = {
  id: string
  websiteUrl: string
  auditType: string
  createdAt: string
  status: AuditSessionStatus
  entitlementConsumedAt?: string | null
}

export type AuditEntitlementLedgerSnapshot = {
  id: string
  auditId: string | null
  websiteUrl: string
  auditType: string
  completedAt: string
  consumedAt: string
}
