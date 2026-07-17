import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { BusinessFoundationRequired } from "@/components/business/BusinessFoundationRequired"
import { CurrentPlanCard } from "@/components/billing/CurrentPlanCard"
import { ChangeSubscriptionModal } from "@/components/billing/ChangeSubscriptionModal"
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
import { Button } from "@/components/ui/button"
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
  const [isCancelling, setIsCancelling] = useState(false)
  const [isCancellingScheduledChange, setIsCancellingScheduledChange] = useState(false)
  const [changeModalOpen, setChangeModalOpen] = useState(false)
  const [pendingPlanTarget, setPendingPlanTarget] = useState<SubscriptionPlanId | null>(null)
  const [isSchedulingPendingPlan, setIsSchedulingPendingPlan] = useState(false)

  useEffect(() => {
    function resetCheckoutInteractionState() {
      setLoadingPlanId(null)
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

  async function handlePlanSelect(planId: SubscriptionPlanId) {
    if (planId === "free" || !data) return
    if (billingService.isPaidPlanSelectionBlocked(data, planId)) return

    if (data.showPendingPlanCheckout) {
      setLoadingPlanId(planId)
      try {
        await billingService.setPendingPlan(userId, planId)
        const mode = await billingService.redirectToCheckout(userId, planId, {
          onCheckoutDismissed: () => setLoadingPlanId(null),
          onCheckoutSuccess: () => {
            navigate(`${ROUTES.billingReturn}?checkout=success`, { replace: true })
          },
        })
        if (mode === "modal") {
          setLoadingPlanId(null)
        }
      } catch (checkoutError) {
        showErrorToast(
          "Checkout failed",
          checkoutError instanceof Error ? checkoutError : new Error("Unable to start checkout")
        )
        setLoadingPlanId(null)
      }
      return
    }

    if (billingService.shouldUsePendingPlanFlow(data)) {
      setPendingPlanTarget(planId)
      setChangeModalOpen(true)
      return
    }

    setLoadingPlanId(planId)
    try {
      const mode = await billingService.requestPlanChange(userId, planId, {
        onCheckoutDismissed: () => setLoadingPlanId(null),
        onCheckoutSuccess: () => {
          navigate(`${ROUTES.billingReturn}?checkout=success`, { replace: true })
        },
      })
      if (mode === "modal") {
        setLoadingPlanId(null)
      }
    } catch (checkoutError) {
      showErrorToast(
        "Checkout failed",
        checkoutError instanceof Error ? checkoutError : new Error("Unable to start checkout")
      )
      setLoadingPlanId(null)
    }
  }

  async function handleConfirmPendingPlanChange() {
    if (!pendingPlanTarget) return
    const selectedPlan = pendingPlanTarget
    setIsSchedulingPendingPlan(true)
    try {
      await billingService.schedulePendingPlanChange(userId, selectedPlan)
      setChangeModalOpen(false)
      setPendingPlanTarget(null)
      await reload()
      void refreshSession()
      const planName =
        data?.plans.find((plan) => plan.id === selectedPlan)?.name ?? "your next plan"
      setPortalMessage(
        `Your current plan stays active until it ends. We'll remember ${planName} as your next plan.`
      )
    } catch (scheduleError) {
      showErrorToast(
        "Unable to save plan choice",
        scheduleError instanceof Error
          ? scheduleError
          : new Error("Unable to save your next plan")
      )
    } finally {
      setIsSchedulingPendingPlan(false)
    }
  }

  async function handleResumePendingPlanCheckout() {
    if (!data?.pendingPlanChange) return
    await handlePlanSelect(data.pendingPlanChange.planId)
  }

  async function handleCancelScheduledChange() {
    setIsCancellingScheduledChange(true)
    try {
      await billingService.cancelScheduledPlanChange(userId)
      await reload()
      void refreshSession()
    } catch (cancelError) {
      showErrorToast(
        "Cancellation failed",
        cancelError instanceof Error
          ? cancelError
          : new Error("Unable to cancel scheduled change")
      )
    } finally {
      setIsCancellingScheduledChange(false)
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
      scheduledPlanChange={data.scheduledPlanChange}
      pendingPlanChange={data.pendingPlanChange}
      onCancel={
        data.plan.planId !== "free" &&
        data.plan.planId !== "internal" &&
        !data.plan.cancelAtPeriodEnd
          ? handleCancelSubscription
          : undefined
      }
      onCancelScheduledChange={
        data.scheduledPlanChange ? handleCancelScheduledChange : undefined
      }
      onUpgrade={() => {
        const nextPlan = data.plans.find((p) => !p.highlight && p.priceUsd > 0)
        if (nextPlan) void handlePlanSelect(nextPlan.id)
      }}
      isCancelling={isCancelling}
      isCancellingScheduledChange={isCancellingScheduledChange}
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

      {data.showPendingPlanCheckout && data.pendingPlanChange ? (
        <Card className="app-card-compact hover:translate-y-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Text size="sm" className="max-w-none font-medium text-foreground">
                Continue with your selected plan
              </Text>
              <Text variant="muted" size="sm" className="max-w-none">
                Subscribe to {data.pendingPlanChange.planName} when you&apos;re ready.
              </Text>
            </div>
            <Button
              size="sm"
              disabled={loadingPlanId != null}
              onClick={() => void handleResumePendingPlanCheckout()}
            >
              {loadingPlanId === data.pendingPlanChange.planId
                ? "Opening checkout…"
                : `Subscribe to ${data.pendingPlanChange.planName}`}
            </Button>
          </div>
        </Card>
      ) : null}

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
              currentPlanId={data.plan.planId}
              pendingPlanId={data.pendingPlanChange?.planId ?? null}
              onSelect={(planId) => void handlePlanSelect(planId)}
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

      <ChangeSubscriptionModal
        open={changeModalOpen}
        targetPlanName={
          data.plans.find((plan) => plan.id === pendingPlanTarget)?.name ?? "your next plan"
        }
        renewalDate={data.plan.renewalDate}
        isSubmitting={isSchedulingPendingPlan}
        onClose={() => {
          if (isSchedulingPendingPlan) return
          setChangeModalOpen(false)
          setPendingPlanTarget(null)
        }}
        onKeepCurrentPlan={() => {
          setChangeModalOpen(false)
          setPendingPlanTarget(null)
        }}
        onCancelAndChooseNextPlan={() => void handleConfirmPendingPlanChange()}
      />
    </AppPageShell>
  )
}

export default BillingPage
