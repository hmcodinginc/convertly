import { Text } from "@/components/ui/typography/Text"
import type { AuditEntitlementCheck } from "@/types/entitlement"

type AuditAllowanceBadgeProps = {
  entitlement: AuditEntitlementCheck
  className?: string
}

function AuditAllowanceBadge({ entitlement, className }: AuditAllowanceBadgeProps) {
  const remainingLabel = `${entitlement.auditsRemaining} / ${entitlement.auditsIncluded} remaining`

  return (
    <div
      className={
        className ??
        "inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] px-3 py-1.5"
      }
    >
      <Text size="sm" className="max-w-none text-foreground/90">
        <span className="font-medium text-foreground">{entitlement.planName}</span>
        <span className="text-muted"> · {remainingLabel}</span>
      </Text>
    </div>
  )
}

export { AuditAllowanceBadge }
