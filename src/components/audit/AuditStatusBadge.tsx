import { getAuditStatusLabel, getAuditStatusVariant } from "@/lib/auditStatus"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import type { AuditStatus } from "@/types/audit"

type AuditStatusBadgeProps = {
  status: AuditStatus
  className?: string
}

function AuditStatusBadge({ status, className }: AuditStatusBadgeProps) {
  return (
    <StatusBadge
      label={getAuditStatusLabel(status)}
      variant={getAuditStatusVariant(status)}
      className={className}
    />
  )
}

export { AuditStatusBadge }
