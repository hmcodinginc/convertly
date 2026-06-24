import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { PageError, PageLoading } from "@/components/feedback/PageState"
import { AppPageHeader } from "@/components/layout/AppPageHeader"
import { AppPageSection } from "@/components/layout/AppPageSection"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { useAsyncData } from "@/hooks/useAsyncData"
import { ROUTES } from "@/lib/routes"
import * as billingService from "@/services/billingService"
import { cn } from "@/lib/utils"

function BillingPage() {
  const { data, isLoading, isError, error, reload } = useAsyncData(
    () => billingService.getBilling(),
    []
  )

  const header = (
    <AppPageHeader
      eyebrow="Subscription"
      title="Billing"
      description="Manage your plan, usage, and audit credits."
    />
  )

  if (isLoading) {
    return (
      <AppPageShell header={header}>
        <PageLoading label="Loading billing…" />
      </AppPageShell>
    )
  }

  if (isError || !data) {
    return (
      <AppPageShell header={header}>
        <PageError description={error ?? undefined} onRetry={reload} />
      </AppPageShell>
    )
  }

  const { plan, usage, credits, plans } = data
  const creditsPercent = Math.round((credits.remaining / credits.total) * 100)

  return (
    <AppPageShell header={header}>
      <Card className="app-card-body app-card-stack hover:translate-y-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionHeader
            variant="app"
            title="Current plan"
            description={`Renews ${plan.renewalDate}`}
          />
          <StatusBadge label={plan.status} variant="success" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-medium tracking-tight text-foreground">
            {plan.price}
          </span>
          <Text variant="muted" size="sm" className="max-w-none">
            {plan.interval}
          </Text>
        </div>
        <Text size="sm" className="max-w-none font-medium text-foreground/90">
          {plan.name} plan
        </Text>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            Manage subscription
          </Button>
          <Button size="sm">Upgrade plan</Button>
        </div>
      </Card>

      <AppPageSection
        eyebrow="Plans"
        title="Upgrade your workspace"
        description="Scale audit volume and team seats as your conversion program grows."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((planOption) => (
            <Card
              key={planOption.id}
              className={cn(
                "app-card-body flex flex-col gap-5 hover:translate-y-0",
                planOption.highlight &&
                  "border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_20%,transparent)]"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  {planOption.name}
                </h3>
                {planOption.highlight ? <StatusBadge label="Current" variant="accent" /> : null}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-medium tracking-tight">{planOption.price}</span>
                <Text variant="muted" size="sm" className="max-w-none">
                  /mo
                </Text>
              </div>
              <Text variant="muted" size="sm" className="max-w-none leading-6">
                {planOption.audits} audits per month
              </Text>
              <Button
                variant={planOption.highlight ? "outline" : "default"}
                size="sm"
                className="mt-auto w-full"
                disabled={planOption.highlight}
              >
                {planOption.highlight ? "Current plan" : `Upgrade to ${planOption.name}`}
              </Button>
            </Card>
          ))}
        </div>
      </AppPageSection>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="app-card-table hover:translate-y-0">
          <div className="app-card-table-header">
            <SectionHeader
              variant="app"
              title="Usage summary"
              description="Current billing period consumption."
            />
          </div>
          <div className="grid gap-px bg-[color-mix(in_srgb,var(--border)_50%,transparent)] sm:grid-cols-2">
            {usage.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 bg-[color-mix(in_srgb,var(--card)_96%,transparent)] px-5 py-3.5"
              >
                <Text size="sm" className="max-w-none font-medium text-foreground/85">
                  {item.label}
                </Text>
                <Text size="sm" className="max-w-none tabular-nums text-foreground/75">
                  {item.value}
                  <span className="text-muted"> / {item.limit}</span>
                </Text>
              </div>
            ))}
          </div>
        </Card>

        <Card className="app-card-body app-card-stack hover:translate-y-0">
          <SectionHeader
            variant="app"
            title="Audit credits"
            description={`Resets ${credits.resetsOn}`}
          />
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-medium tabular-nums tracking-tight text-foreground">
                {credits.remaining}
              </p>
              <Text variant="muted" size="sm" className="mt-1 max-w-none">
                of {credits.total} remaining
              </Text>
            </div>
            <Text size="sm" className="max-w-none font-medium text-[#86efac]">
              {creditsPercent}% left
            </Text>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--surface)_80%,transparent)]">
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${creditsPercent}%` }}
            />
          </div>
        </Card>
      </div>

      <Text variant="muted" size="sm" className="max-w-none">
        Need enterprise limits?{" "}
        <Link to={ROUTES.workspace} className="text-foreground/80 underline-offset-4 hover:underline">
          Contact sales via workspace settings
        </Link>
      </Text>
    </AppPageShell>
  )
}

export default BillingPage
