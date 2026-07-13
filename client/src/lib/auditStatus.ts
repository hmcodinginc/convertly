import type { StatusBadgeVariant } from "@/components/dashboard/StatusBadge"
import type { AuditSessionStatus } from "@/types/auditEngine"
import type { AuditStatus } from "@/types/audit"

const SESSION_STATUS_LABELS: Record<AuditSessionStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  crawling: "Crawling",
  analyzing: "Analyzing",
  completed: "Completed",
  failed: "Failed",
}

const SESSION_STATUS_VARIANTS: Record<AuditSessionStatus, StatusBadgeVariant> = {
  draft: "neutral",
  pending: "neutral",
  crawling: "accent",
  analyzing: "accent",
  completed: "success",
  failed: "danger",
}

const LEGACY_STATUS_LABELS: Record<"Completed" | "Running" | "Scheduled", string> = {
  Completed: "Completed",
  Running: "Running",
  Scheduled: "Scheduled",
}

const LEGACY_STATUS_VARIANTS: Record<
  "Completed" | "Running" | "Scheduled",
  StatusBadgeVariant
> = {
  Completed: "success",
  Running: "accent",
  Scheduled: "neutral",
}

export function isAuditSessionStatus(status: AuditStatus): status is AuditSessionStatus {
  return status in SESSION_STATUS_LABELS
}

export function isAuditInProgress(status: AuditStatus): boolean {
  if (status === "Running" || status === "Scheduled") return true
  return status === "pending" || status === "crawling" || status === "analyzing"
}

export function getAuditStatusLabel(status: AuditStatus): string {
  if (isAuditSessionStatus(status)) {
    return SESSION_STATUS_LABELS[status]
  }
  return LEGACY_STATUS_LABELS[status]
}

export function getAuditStatusVariant(status: AuditStatus): StatusBadgeVariant {
  if (isAuditSessionStatus(status)) {
    return SESSION_STATUS_VARIANTS[status]
  }
  return LEGACY_STATUS_VARIANTS[status]
}

export function sessionStatusToAuditStatus(status: AuditSessionStatus): AuditStatus {
  return status
}
