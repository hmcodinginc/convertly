import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { BusinessFoundationRequired } from "@/components/business/BusinessFoundationRequired"
import { CurrentPlanCard } from "@/components/billing/CurrentPlanCard"
import { PaymentNotice } from "@/components/billing/PaymentNotice"
import { PlanCard } from "@/components/billing/PlanCard"
import { PremiumCelebrationBanner } from "@/components/billing/PremiumCelebrationBanner"
import { PremiumWelcomeCard } from "@/components/billing/PremiumWelcomeCard"
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
import { usePaymentNotice } from "@/hooks/usePaymentNotice"
import {
  clearAllPaymentClientState,
  reconcilePendingCheckout,
} from "@/lib/checkoutPersistence"
import { isBusinessFoundationEnabled } from "@/lib/businessFoundation"
import { getPreviousPlanLabel } from "@/lib/premiumActivationContent"
import {
  dismissPremiumWelcome,
  peekPremiumActivation,
  shouldShowPremiumWelcome,
  type PremiumActivationContext,
} from "@/lib/premiumWelcomePersistence"
import { type SubscriptionPlanId } from "@/lib/billingPlans"
import { isKnownPlan } from "@/services/pricingService"
import { ROUTES } from "@/lib/routes"
import { persistPaymentNotice } from "@/lib/paymentNoticePersistence"
import { showErrorToast } from "@/lib/toast"
import * as billingService from "@/services/billingService"

function resolveActivationContext(
  activatedParam: string | null,
  planName: string
): PremiumActivationContext | null {
  const sessionActivation = peekPremiumActivation()
  if (sessionActivation) return sessionActivation

  if (activatedParam && isKnownPlan(activatedParam)) {
    return {
      planId: activatedParam as SubscriptionPlanId,
      planName,
      previousPlanId: "free",
      activatedAt: Date.now(),
    }
  }

  return null
}

function BillingPage() {
  const { session, refreshSession } = useAuthSession()
  const userId = session?.userId ?? ""
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const shouldReduceMotion = useReducedMotion()
  const [activationContext, setActivationContext] = useState<PremiumActivationContext | null>(
    null
  )
  const [showWelcomeCard, setShowWelcomeCard] = useState(false)
  const [celebrateUpgrade, setCelebrateUpgrade] = useState(false)
  const [portalMessage, setPortalMessage] = useState<string | null>(null)
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)
  const [isManaging, setIsManaging] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    function resetCheckoutInteractionState() {
      setLoadingPlanId(null)
      setIsManaging(false)
    }

    resetCheckoutInteractionState()
    window.addEventListener("pageshow", resetCheckoutInteractionState)
    return () => window.removeEventListener("pageshow", resetCheckoutInteractionState)
  }, [userId])

  const { data, isLoading, isError, error, reload } = useAsyncData(
    () => billingService.getBilling(userId),
    [userId],
    { enabled: Boolean(userId) && isBusinessFoundationEnabled() }
  )

  const { notice: paymentNotice, dismiss: dismissPaymentNotice } = usePaymentNotice({
    userId,
    billing: data,
    billingLoadFailed: isError,
    loadingPlanId,
  })

  const previousPlanName = useMemo(
    () =>
      activationContext ? getPreviousPlanLabel(activationContext.previousPlanId) : null,
    [activationContext]
  )

  useEffect(() => {
    const checkout = searchParams.get("checkout")

    if (checkout === "canceled" || checkout === "cancelled") {
      navigate(`${ROUTES.billingReturn}?checkout=cancelled`, { replace: true })
      return
    }

    if (checkout === "timedOut") {
      clearAllPaymentClientState()
      persistPaymentNotice(userId, "verification_delayed")
      setSearchParams({}, { replace: true })
      return
    }

    if (checkout === "success" || checkout === "failed") {
      navigate(`${ROUTES.billingReturn}?checkout=${checkout}`, { replace: true })
      return
    }

    const activated = searchParams.get("activated")
    const portal = searchParams.get("portal")

    if (portal === "manage") {
      setPortalMessage(
        "You're back from subscription management. Plan and billing details below will refresh automatically."
      )
      void reload()
      void refreshSession()
      setSearchParams({}, { replace: true })
      return
    }

    if (!activated || !data) return

    const context = resolveActivationContext(activated, data.plan.name)
    if (!context) return

    setActivationContext(context)
    setCelebrateUpgrade(true)
    void refreshSession()
    reload()

    if (userId && shouldShowPremiumWelcome(userId, context.planId)) {
      setShowWelcomeCard(true)
    }

    setSearchParams({}, { replace: true })

    const timerId = window.setTimeout(() => {
      setCelebrateUpgrade(false)
    }, 6_000)

    return () => window.clearTimeout(timerId)
  }, [data, navigate, reload, refreshSession, searchParams, setSearchParams, userId])

  useEffect(() => {
    if (!userId || !data) return
    reconcilePendingCheckout(userId, data)
  }, [data, userId])

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
        <AnimatePresence mode="wait">
          {paymentNotice ? (
            <PaymentNotice
              key={paymentNotice.kind}
              notice={paymentNotice}
              onDismiss={paymentNotice.dismissible ? dismissPaymentNotice : undefined}
            />
          ) : null}
        </AnimatePresence>
        <PageLoading label="Loading billing…" />
      </AppPageShell>
    )
  }

  if (isError || !data) {
    return (
      <AppPageShell header={header}>
        <AnimatePresence mode="wait">
          {paymentNotice ? (
            <PaymentNotice
              key={paymentNotice.kind}
              notice={paymentNotice}
              onDismiss={paymentNotice.dismissible ? dismissPaymentNotice : undefined}
            />
          ) : null}
        </AnimatePresence>
        <PageError description={error ?? undefined} onRetry={reload} />
      </AppPageShell>
    )
  }

  async function handleUpgrade(planId: SubscriptionPlanId) {
    if (planId === "free") return
    setLoadingPlanId(planId)
    try {
      const mode = await billingService.redirectToCheckout(userId, planId, {
        onCheckoutDismissed: () => setLoadingPlanId(null),
        onCheckoutSuccess: () => {
          navigate(`${ROUTES.billingReturn}?checkout=success`, { replace: true })
        },
      })
      if (mode === "modal") {
        setLoadingPlanId(null)
      }
    } catch (upgradeError) {
      showErrorToast(
        "Checkout failed",
        upgradeError instanceof Error ? upgradeError : new Error("Unable to start checkout")
      )
      setLoadingPlanId(null)
    }
  }

  async function handleCancelSubscription() {
    setIsCancelling(true)
    try {
      await billingService.cancelSubscriptionAtPeriodEnd(userId)
      await reload()
      void refreshSession()
      setPortalMessage("Your subscription will cancel at the end of the current billing period.")
    } catch (cancelError) {
      showErrorToast(
        "Cancellation failed",
        cancelError instanceof Error ? cancelError : new Error("Unable to cancel subscription")
      )
    } finally {
      setIsCancelling(false)
    }
  }

  async function handleManage() {
    setIsManaging(true)
    try {
      await billingService.redirectToBillingPortal(userId)
    } catch (portalError) {
      showErrorToast(
        "Billing portal failed",
        portalError instanceof Error ? portalError : new Error("Unable to open billing portal")
      )
      setIsManaging(false)
    }
  }

  function handleDismissWelcome() {
    if (userId && activationContext) {
      dismissPremiumWelcome(userId, activationContext.planId)
    }
    setShowWelcomeCard(false)
  }

  const showUpgradeCta = data.canUpgrade
  const isCelebrating = celebrateUpgrade || Boolean(activationContext)

  const planCard = (
    <CurrentPlanCard
      plan={data.plan}
      onManage={
        data.plan.planId !== "free" && data.plan.planId !== "internal"
          ? handleManage
          : undefined
      }
      onCancel={
        data.plan.planId !== "free" &&
        data.plan.planId !== "internal" &&
        !data.plan.cancelAtPeriodEnd
          ? handleCancelSubscription
          : undefined
      }
      onUpgrade={() => {
        const nextPlan = data.plans.find((p) => !p.highlight && p.priceUsd > 0)
        if (nextPlan) void handleUpgrade(nextPlan.id)
      }}
      isManaging={isManaging}
      isCancelling={isCancelling}
      showUpgrade={showUpgradeCta}
      justActivated={isCelebrating}
      animateBadgeOnce={isCelebrating}
    />
  )

  return (
    <AppPageShell header={header}>
      {portalMessage ? (
        <AuthFormMessage variant="success">{portalMessage}</AuthFormMessage>
      ) : null}

      {isCelebrating && !showWelcomeCard ? (
        <PremiumCelebrationBanner planName={data.plan.name} />
      ) : null}

      <AnimatePresence>
        {showWelcomeCard && activationContext ? (
          <PremiumWelcomeCard
            planId={activationContext.planId}
            planName={activationContext.planName}
            onDismiss={handleDismissWelcome}
          />
        ) : null}
      </AnimatePresence>

      {data.usage.auditsRemaining === 0 ? (
        <AuthFormMessage>
          You&apos;ve used all audits included in your {data.plan.name} plan. Upgrade to continue
          running conversion audits.
        </AuthFormMessage>
      ) : null}

      <AnimatePresence mode="wait">
        {paymentNotice ? (
          <PaymentNotice
            key={paymentNotice.kind}
            notice={paymentNotice}
            onDismiss={paymentNotice.dismissible ? dismissPaymentNotice : undefined}
          />
        ) : null}
      </AnimatePresence>

      <div className="grid billing-top-grid items-stretch gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {isCelebrating && !shouldReduceMotion ? (
          <motion.div
            key={data.plan.planId}
            initial={{ opacity: 0.88, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {planCard}
          </motion.div>
        ) : (
          planCard
        )}

        <Card className="app-card-compact billing-usage-card h-full hover:translate-y-0">
          <UsageSummaryCard
            usage={data.usage}
            planName={data.plan.name}
            previousPlanName={previousPlanName}
            celebrateUpgrade={celebrateUpgrade}
            stretch
          />
        </Card>
      </div>

      <AppPageSection
        eyebrow="Plans"
        title="Upgrade your workspace"
        description="Scale audit volume as your conversion program grows. Prices shown in USD; checkout may display localized amounts."
      >
        <div className="billing-plan-grid billing-plan-card-grid grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.plans.map((planOption) => (
            <PlanCard
              key={planOption.id}
              plan={planOption}
              onSelect={(planId) => void handleUpgrade(planId)}
              isLoading={loadingPlanId != null}
              loadingPlanId={loadingPlanId}
              animateCurrentBadge={isCelebrating && planOption.highlight}
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
