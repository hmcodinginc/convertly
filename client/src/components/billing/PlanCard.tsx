import { Loader2 } from "lucide-react"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import type { BillingPlanOption } from "@/types/billing"
import { cn } from "@/lib/utils"

type PlanCardProps = {
  plan: BillingPlanOption
  onSelect: (planId: BillingPlanOption["id"]) => void
  isLoading?: boolean
  loadingPlanId?: string | null
}

function PlanCard({ plan, onSelect, isLoading, loadingPlanId }: PlanCardProps) {
  const isCurrent = plan.highlight
  const isBusy = isLoading && loadingPlanId === plan.id

  return (
    <Card
      className={cn(
        "app-card-body flex flex-col gap-5 hover:translate-y-0",
        plan.highlight &&
          "border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_20%,transparent)]"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          {plan.name}
        </h3>
        {isCurrent ? <StatusBadge label="Current" variant="accent" /> : null}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-medium tracking-tight">{plan.price}</span>
        {plan.priceUsd > 0 ? (
          <Text variant="muted" size="sm" className="max-w-none">
            /mo
          </Text>
        ) : null}
      </div>
      <Text variant="muted" size="sm" className="max-w-none leading-6">
        {plan.description}
      </Text>
      <Text variant="muted" size="sm" className="max-w-none text-xs">
        {plan.period === "lifetime"
          ? `${plan.audits} lifetime audits`
          : `${plan.audits} audits per month`}
      </Text>
      <Button
        variant={isCurrent ? "outline" : "default"}
        size="sm"
        className="mt-auto w-full"
        disabled={isCurrent || isLoading}
        onClick={() => onSelect(plan.id)}
      >
        {isBusy ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Redirecting…
          </>
        ) : isCurrent ? (
          "Current plan"
        ) : plan.priceUsd === 0 ? (
          "Included"
        ) : (
          `Upgrade to ${plan.name}`
        )}
      </Button>
    </Card>
  )
}

export { PlanCard }
