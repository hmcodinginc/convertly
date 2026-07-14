import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { ROUTES } from "@/lib/routes"
import type { AuditEntitlementCheck } from "@/types/entitlement"

type AuditLimitReachedCardProps = {
  entitlement: AuditEntitlementCheck
}

function AuditLimitReachedCard({ entitlement }: AuditLimitReachedCardProps) {
  const renewalLabel = entitlement.periodEndFormatted ?? "your next billing date"

  return (
    <Card className="app-card-compact hover:translate-y-0">
      <div className="space-y-4">
        <div className="space-y-2">
          <Text size="sm" className="max-w-none font-medium text-foreground">
            You&apos;ve reached your monthly audit limit.
          </Text>
          <Text variant="muted" size="sm" className="max-w-none leading-6">
            Your plan renews on {renewalLabel}. Because of Razorpay subscription rules, plan
            changes become available at renewal.
          </Text>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.dashboard}>Return to Dashboard</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to={ROUTES.billing}>Billing</Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}

export { AuditLimitReachedCard }
