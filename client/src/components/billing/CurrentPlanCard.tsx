import { AnimatedStatusBadge } from "@/components/dashboard/AnimatedStatusBadge"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { cn } from "@/lib/utils"
import type { BillingPlanSummary } from "@/types/billing"

type CurrentPlanCardProps = {
  plan: BillingPlanSummary
  onManage?: () => void
  onCancel?: () => void
  onUpgrade?: () => void
  isManaging?: boolean
  isCancelling?: boolean
  showUpgrade?: boolean
  justActivated?: boolean
  animateBadgeOnce?: boolean
}

function InternalAccountBadge() {
  return (
    <div className="rounded-xl border border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface))] px-3.5 py-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <StatusBadge label="Internal account" variant="accent" />
        <Text size="sm" className="max-w-none text-foreground/85">
          HM Coding internal access · no subscription required
        </Text>
      </div>
    </div>
  )
}

function isPaidPlan(planId: BillingPlanSummary["planId"]): boolean {
  return planId === "starter" || planId === "growth" || planId === "scale"
}

function CurrentPlanCard({
  plan,
  onManage,
  onCancel,
  onUpgrade,
  isManaging,
  isCancelling,
  showUpgrade,
  justActivated,
  animateBadgeOnce = false,
}: CurrentPlanCardProps) {
  const isInternalAccount = plan.planId === "internal"
  const isPremium = isPaidPlan(plan.planId)
  const statusVariant =
    plan.status === "active" || plan.status === "trialing" ? "success" : "warning"

  return (
    <Card
      className={cn(
        "app-card-compact billing-plan-card h-full hover:translate-y-0",
        justActivated &&
          "border-[color-mix(in_srgb,#34d399_28%,var(--border))] shadow-[0_0_0_1px_color-mix(in_srgb,#34d399_12%,transparent),0_14px_38px_rgba(2,6,23,0.38)]"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <SectionHeader
          variant="app"
          className="!space-y-1"
          title="Current plan"
          description={
            isInternalAccount
              ? "Internal workspace access"
              : plan.renewalDate
                ? `Renews ${plan.renewalDate}`
                : plan.planId === "free"
                  ? "Free lifetime allowance"
                  : "Billing period"
          }
        />
        <div className="flex flex-wrap items-center gap-2">
          {isPremium ? (
            <AnimatedStatusBadge
              label="Premium active"
              variant="success"
              animateOnce={animateBadgeOnce || justActivated}
            />
          ) : null}
          <AnimatedStatusBadge
            label={isInternalAccount ? "Internal" : plan.status.replace("_", " ")}
            variant={statusVariant}
            animateOnce={animateBadgeOnce && isPremium}
          />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-medium tracking-tight text-foreground">
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
      {isInternalAccount ? (
        <InternalAccountBadge />
      ) : (
        <div className="billing-plan-card__actions">
          {plan.planId !== "free" && onManage ? (
            <Button
              variant="outline"
              size="sm"
              disabled={isManaging || isCancelling}
              onClick={() => void onManage()}
            >
              {isManaging ? "Opening…" : "Manage subscription"}
            </Button>
          ) : null}
          {plan.planId !== "free" && onCancel && !plan.cancelAtPeriodEnd ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={isManaging || isCancelling}
              onClick={() => void onCancel()}
            >
              {isCancelling ? "Cancelling…" : "Cancel subscription"}
            </Button>
          ) : null}
          {showUpgrade && onUpgrade ? (
            <Button size="sm" onClick={() => void onUpgrade()}>
              Upgrade plan
            </Button>
          ) : null}
        </div>
      )}
    </Card>
  )
}

export { CurrentPlanCard }
