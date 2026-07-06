import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { BusinessFoundationRequired } from "@/components/business/BusinessFoundationRequired"
import { CurrentPlanCard } from "@/components/billing/CurrentPlanCard"
import { PlanCard } from "@/components/billing/PlanCard"
import { UsageSummaryCard } from "@/components/billing/UsageSummaryCard"
import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { PageError, PageLoading } from "@/components/feedback/PageState"
import { AppPageHeader } from "@/components/layout/AppPageHeader"
import { AppPageSection } from "@/components/layout/AppPageSection"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { useAuthSession } from "@/hooks/useAuthSession"
import { useAsyncData } from "@/hooks/useAsyncData"
import { isBusinessFoundationEnabled } from "@/lib/businessFoundation"
import { ROUTES } from "@/lib/routes"
import { showErrorToast } from "@/lib/toast"
import * as billingService from "@/services/billingService"
import type { SubscriptionPlanId } from "@/lib/billingPlans"

function BillingPage() {
  const { session, refreshSession } = useAuthSession()
  const userId = session?.userId ?? ""
  const [searchParams, setSearchParams] = useSearchParams()
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null)
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)
  const [isManaging, setIsManaging] = useState(false)

  const { data, isLoading, isError, error, reload } = useAsyncData(
    () => billingService.getBilling(userId),
    [userId],
    { enabled: Boolean(userId) && isBusinessFoundationEnabled() }
  )

  useEffect(() => {
    const checkout = searchParams.get("checkout")
    if (checkout === "success") {
      setCheckoutMessage("Subscription updated successfully.")
      void refreshSession()
      reload()
      setSearchParams({}, { replace: true })
    } else if (checkout === "canceled") {
      setCheckoutMessage("Checkout was canceled.")
      setSearchParams({}, { replace: true })
    }

    const portal = searchParams.get("portal")
    if (portal === "manage") {
      setCheckoutMessage(
        "Subscription management is handled on this page. Contact support to cancel or change payment method."
      )
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, refreshSession, reload])

  const header = (
    <AppPageHeader
      eyebrow="Subscription"
      title="Billing"
      description="Manage your plan, usage, and audit allowance."
    />
  )

  if (!isBusinessFoundationEnabled()) {
    return (
      <AppPageShell header={header}>
        <BusinessFoundationRequired />
      </AppPageShell>
    )
  }

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

  async function handleUpgrade(planId: SubscriptionPlanId) {
    if (planId === "free") return
    setLoadingPlanId(planId)
    try {
      await billingService.redirectToCheckout(planId)
    } catch (upgradeError) {
      showErrorToast(
        "Checkout failed",
        upgradeError instanceof Error ? upgradeError : new Error("Unable to start checkout")
      )
      setLoadingPlanId(null)
    }
  }

  async function handleManage() {
    setIsManaging(true)
    try {
      await billingService.redirectToBillingPortal()
    } catch (portalError) {
      showErrorToast(
        "Billing portal failed",
        portalError instanceof Error ? portalError : new Error("Unable to open billing portal")
      )
      setIsManaging(false)
    }
  }

  const showUpgradeCta =
    data.plan.planId === "free" || data.usage.auditsRemaining === 0

  return (
    <AppPageShell header={header}>
      {checkoutMessage ? (
        <AuthFormMessage variant="success">{checkoutMessage}</AuthFormMessage>
      ) : null}

      {data.usage.auditsRemaining === 0 ? (
        <AuthFormMessage>
          You&apos;ve used all audits included in your {data.plan.name} plan. Upgrade to continue
          running conversion audits.
        </AuthFormMessage>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <CurrentPlanCard
          plan={data.plan}
          onManage={data.plan.planId !== "free" ? handleManage : undefined}
          onUpgrade={() => {
            const nextPlan = data.plans.find((p) => !p.highlight && p.priceUsd > 0)
            if (nextPlan) void handleUpgrade(nextPlan.id)
          }}
          isManaging={isManaging}
          showUpgrade={showUpgradeCta}
        />

        <Card className="app-card-body app-card-stack hover:translate-y-0">
          <UsageSummaryCard usage={data.usage} planName={data.plan.name} />
        </Card>
      </div>

      <AppPageSection
        eyebrow="Plans"
        title="Upgrade your workspace"
        description="Scale audit volume as your conversion program grows. Prices shown in USD; checkout may display localized amounts."
      >
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {data.plans.map((planOption) => (
            <PlanCard
              key={planOption.id}
              plan={planOption}
              onSelect={(planId) => void handleUpgrade(planId)}
              isLoading={loadingPlanId != null}
              loadingPlanId={loadingPlanId}
            />
          ))}
        </div>
      </AppPageSection>

      <Text variant="muted" size="sm" className="max-w-none">
        Manage domains and workspace details on{" "}
        <Link to={ROUTES.workspace} className="text-foreground/80 underline-offset-4 hover:underline">
          Workspace
        </Link>
        . Notification and account preferences live in{" "}
        <Link to={ROUTES.settingsPreferences} className="text-foreground/80 underline-offset-4 hover:underline">
          Settings
        </Link>
        .
      </Text>
    </AppPageShell>
  )
}

export default BillingPage
