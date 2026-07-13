import { Link } from "react-router-dom"

import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { ROUTES } from "@/lib/routes"
import type { AuditEntitlementCheck } from "@/types/entitlement"

type AuditLimitInfoCardProps = {
  entitlement: AuditEntitlementCheck
}

function AuditLimitInfoCard({ entitlement }: AuditLimitInfoCardProps) {
  const renewalLabel =
    entitlement.periodEndFormatted?.replace(/, \d{4}$/, "") ??
    "your next billing date"

  return (
    <Card className="app-card-compact audit-limit-info-card hover:translate-y-0">
      <div className="space-y-3">
        <Text size="sm" className="max-w-none font-semibold text-foreground">
          Audit Limit Reached
        </Text>
        <Text variant="muted" size="sm" className="max-w-none leading-6">
          You have used all audits included in your plan.
        </Text>
        <div className="space-y-1">
          <Text variant="muted" size="sm" className="max-w-none text-xs uppercase tracking-wide">
            Your allowance renews on
          </Text>
          <Text size="sm" className="max-w-none font-medium text-foreground">
            {renewalLabel}
          </Text>
        </div>
        <Text variant="muted" size="sm" className="max-w-none leading-6">
          or{" "}
          <Link
            to={ROUTES.billing}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            upgrade
          </Link>{" "}
          when higher plans become available.
        </Text>
      </div>
    </Card>
  )
}

export { AuditLimitInfoCard }
