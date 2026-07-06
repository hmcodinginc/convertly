import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import type { BillingPlanSummary } from "@/types/billing"

type CurrentPlanCardProps = {
  plan: BillingPlanSummary
  onManage?: () => void
  onUpgrade?: () => void
  isManaging?: boolean
  showUpgrade?: boolean
}

function CurrentPlanCard({
  plan,
  onManage,
  onUpgrade,
  isManaging,
  showUpgrade,
}: CurrentPlanCardProps) {
  const statusVariant =
    plan.status === "active" || plan.status === "trialing" ? "success" : "warning"

  return (
    <Card className="app-card-body app-card-stack hover:translate-y-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          variant="app"
          title="Current plan"
          description={
            plan.renewalDate
              ? `Renews ${plan.renewalDate}`
              : plan.planId === "free"
                ? "Free lifetime allowance"
                : "Billing period"
          }
        />
        <StatusBadge label={plan.status.replace("_", " ")} variant={statusVariant} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-medium tracking-tight text-foreground">
          {plan.price.replace("/mo", "")}
        </span>
        <Text variant="muted" size="sm" className="max-w-none">
          {plan.interval}
        </Text>
      </div>
      <Text size="sm" className="max-w-none font-medium text-foreground/90">
        {plan.name} plan
        {plan.cancelAtPeriodEnd ? " · Cancels at period end" : ""}
      </Text>
      <div className="flex flex-wrap gap-2">
        {plan.planId !== "free" && onManage ? (
          <Button
            variant="outline"
            size="sm"
            disabled={isManaging}
            onClick={() => void onManage()}
          >
            {isManaging ? "Opening…" : "Manage subscription"}
          </Button>
        ) : null}
        {showUpgrade && onUpgrade ? (
          <Button size="sm" onClick={() => void onUpgrade()}>
            Upgrade plan
          </Button>
        ) : null}
      </div>
    </Card>
  )
}

export { CurrentPlanCard }
