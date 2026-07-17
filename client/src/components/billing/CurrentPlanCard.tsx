import { AnimatedStatusBadge } from "@/components/dashboard/AnimatedStatusBadge"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { cn } from "@/lib/utils"
import type { BillingPlanSummary, PendingPlanChange, ScheduledPlanChange } from "@/types/billing"

type CurrentPlanCardProps = {
  plan: BillingPlanSummary
  scheduledPlanChange?: ScheduledPlanChange | null
  pendingPlanChange?: PendingPlanChange | null
  onCancel?: () => void
  onCancelScheduledChange?: () => void
  onUpgrade?: () => void
  isCancelling?: boolean
  isCancellingScheduledChange?: boolean
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
  scheduledPlanChange,
  pendingPlanChange,
  onCancel,
  onCancelScheduledChange,
  onUpgrade,
  isCancelling,
  isCancellingScheduledChange,
  showUpgrade,
  justActivated,
  animateBadgeOnce = false,
}: CurrentPlanCardProps) {
  const isInternalAccount = plan.planId === "internal"
  const isPremium = isPaidPlan(plan.planId)
  const statusVariant =
    plan.status === "active" || plan.status === "trialing" ? "success" : "warning"

  const description = isInternalAccount
    ? "Internal workspace access"
    : plan.cancelAtPeriodEnd && plan.renewalDate
      ? `Cancels on ${plan.renewalDate}`
      : scheduledPlanChange?.changeAtFormatted
        ? `Changes to ${scheduledPlanChange.planName} on ${scheduledPlanChange.changeAtFormatted}`
        : plan.renewalDate
          ? `Renews ${plan.renewalDate}`
          : plan.planId === "free"
            ? "Free lifetime allowance"
            : "Billing period"

  const statusLabel = plan.cancelAtPeriodEnd
    ? plan.renewalDate
      ? `Cancels on ${plan.renewalDate}`
      : "Cancels at period end"
    : isInternalAccount
      ? "Internal"
      : plan.status.replace("_", " ")

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
          description={description}
        />
        <div className="flex flex-wrap items-center gap-2">
          {isPremium ? (
            <AnimatedStatusBadge
              label="Premium active"
              variant="success"
              animateOnce={animateBadgeOnce || justActivated}
            />
          ) : null}
          {scheduledPlanChange ? (
            <StatusBadge
              label={`Downgrade to ${scheduledPlanChange.planName}`}
              variant="warning"
            />
          ) : null}
          <AnimatedStatusBadge
            label={statusLabel}
            variant={plan.cancelAtPeriodEnd ? "warning" : statusVariant}
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
        {scheduledPlanChange
          ? ` · ${scheduledPlanChange.planName} starts ${
              scheduledPlanChange.changeAtFormatted ?? "at period end"
            }`
          : ""}
      </Text>

      {pendingPlanChange ? (
        <div className="rounded-xl border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] px-4 py-3.5">
          <Text size="sm" className="max-w-none font-medium text-foreground">
            Next plan
          </Text>
          <Text size="sm" className="mt-1 max-w-none text-foreground/90">
            {pendingPlanChange.planName}
          </Text>
          <Text variant="muted" size="sm" className="mt-1 max-w-none">
            Waiting for activation after current subscription ends.
          </Text>
        </div>
      ) : null}

      {isInternalAccount ? (
        <InternalAccountBadge />
      ) : (
        <div className="billing-plan-card__actions">
          {plan.planId !== "free" && onCancel && !plan.cancelAtPeriodEnd ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={isCancelling}
              onClick={() => void onCancel()}
            >
              {isCancelling ? "Cancelling…" : "Cancel subscription"}
            </Button>
          ) : null}
          {scheduledPlanChange && onCancelScheduledChange ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={isCancelling || isCancellingScheduledChange}
              onClick={() => void onCancelScheduledChange()}
            >
              {isCancellingScheduledChange ? "Cancelling…" : "Cancel scheduled downgrade"}
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
