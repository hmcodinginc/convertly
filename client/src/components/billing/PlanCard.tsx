import { Loader2 } from "lucide-react"
import { useReducedMotion } from "framer-motion"

import { AnimatedStatusBadge } from "@/components/dashboard/AnimatedStatusBadge"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import type { BillingPlanOption } from "@/types/billing"
import { resolvePlanChangeDirection } from "@/lib/planRank"
import type { EffectivePlanId, SubscriptionPlanId } from "@/lib/billingPlans"
import { cn } from "@/lib/utils"

type PlanCardProps = {
  plan: BillingPlanOption
  currentPlanId: EffectivePlanId
  pendingPlanId?: SubscriptionPlanId | null
  onSelect: (planId: BillingPlanOption["id"]) => void
  isLoading?: boolean
  loadingPlanId?: string | null
  animateCurrentBadge?: boolean
}

function PlanCard({
  plan,
  currentPlanId,
  pendingPlanId = null,
  onSelect,
  isLoading,
  loadingPlanId,
  animateCurrentBadge = false,
}: PlanCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const isCurrent = plan.highlight
  const isSelected = !isCurrent && pendingPlanId === plan.id
  const isBusy = isLoading && loadingPlanId === plan.id
  const changeDirection =
    plan.priceUsd > 0 && !isCurrent && !isSelected
      ? resolvePlanChangeDirection(currentPlanId, plan.id)
      : "same"

  const actionLabel = isCurrent
    ? "Current plan"
    : isSelected
      ? "Selected"
      : plan.priceUsd === 0
        ? "Included"
        : changeDirection === "downgrade"
          ? `Downgrade to ${plan.name}`
          : `Upgrade to ${plan.name}`

  const busyLabel =
    changeDirection === "downgrade"
      ? "Saving…"
      : currentPlanId === "free"
        ? "Redirecting…"
        : "Processing…"

  return (
    <Card
      className={cn(
        "app-card-body flex h-full min-h-0 flex-col gap-5 sm:min-h-[18rem] hover:translate-y-0",
        (plan.highlight || isSelected) &&
          "border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_20%,transparent)]",
        animateCurrentBadge &&
          isCurrent &&
          !shouldReduceMotion &&
          "border-[color-mix(in_srgb,#34d399_28%,var(--border))]"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          {plan.name}
        </h3>
        {isCurrent ? (
          animateCurrentBadge ? (
            <AnimatedStatusBadge label="Current" variant="accent" animateOnce />
          ) : (
            <StatusBadge label="Current" variant="accent" />
          )
        ) : isSelected ? (
          <StatusBadge label="Selected" variant="success" />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-4">
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
      </div>
      <Button
        variant={isCurrent || isSelected ? "outline" : "default"}
        size="sm"
        className="mt-auto w-full shrink-0"
        disabled={isCurrent || isSelected || isLoading}
        onClick={() => onSelect(plan.id)}
      >
        {isBusy ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {busyLabel}
          </>
        ) : (
          actionLabel
        )}
      </Button>
    </Card>
  )
}

export { PlanCard }
