import { AnimatePresence } from "framer-motion"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"

import { AuditAllowanceBadge } from "@/components/audit/AuditAllowanceBadge"
import { PendingPlanResumeBanner } from "@/components/billing/PendingPlanResumeBanner"
import { PremiumCelebrationBanner } from "@/components/billing/PremiumCelebrationBanner"
import { PremiumWelcomeCard } from "@/components/billing/PremiumWelcomeCard"
import { OnboardingCard } from "@/components/feedback/OnboardingCard"
import { PageError, PageLoading } from "@/components/feedback/PageState"
import { Button } from "@/components/ui/button"
import { AppPageHeader } from "@/components/layout/AppPageHeader"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { CurrentAuditSelector } from "@/features/dashboard/components/CurrentAuditSelector"
import { AiRecommendationsSection } from "@/features/dashboard/sections/AiRecommendationsSection"
import { DashboardPriorityInsights } from "@/features/dashboard/sections/DashboardPriorityInsights"
import { MetricsOverviewSection } from "@/features/dashboard/sections/MetricsOverviewSection"
import { OpportunityQueueSection } from "@/features/dashboard/sections/OpportunityQueueSection"
import { DraftAuditsSection } from "@/features/dashboard/sections/DraftAuditsSection"
import { RecentAuditsSection } from "@/features/dashboard/sections/RecentAuditsSection"
import { DeleteAuditModal } from "@/features/audits/components/DeleteAuditModal"
import {
  buildOpportunitiesFromAuditDetail,
  buildRecommendationsFromAuditDetail,
  getDefaultSelectedAuditId,
  mergeMetricsForSelectedAudit,
  sortAuditsNewestFirst,
} from "@/features/dashboard/utils/auditDashboardView"
import { useAuthSession } from "@/hooks/useAuthSession"
import { useAsyncData } from "@/hooks/useAsyncData"
import { isBusinessFoundationEnabled } from "@/lib/businessFoundation"
import { type SubscriptionPlanId } from "@/lib/billingPlans"
import {
  dismissPendingPlanBanner,
  isPendingPlanBannerDismissed,
} from "@/lib/pendingPlanBannerPersistence"
import { showErrorToast } from "@/lib/toast"
import { isKnownPlan } from "@/services/pricingService"
import * as billingService from "@/services/billingService"
import {
  dismissPremiumWelcome,
  peekPremiumActivation,
  shouldShowPremiumWelcome,
  type PremiumActivationContext,
} from "@/lib/premiumWelcomePersistence"
import { ROUTES } from "@/lib/routes"
import { getAuditEntitlement } from "@/services/entitlementService"
import * as auditService from "@/services/auditService"
import type { Audit, Recommendation } from "@/types/audit"
import type { AuditDraft } from "@/types/auditDraft"
import type { DashboardMetric, OpportunityItem } from "@/types/dashboard"

type DashboardData = {
  metrics: DashboardMetric[]
  audits: Audit[]
  drafts: AuditDraft[]
  showOnboarding: boolean
}

async function loadDashboard(): Promise<DashboardData> {
  const bundle = await auditService.getDashboardData()

  return {
    metrics: bundle.metrics,
    audits: sortAuditsNewestFirst(bundle.audits),
    drafts: bundle.drafts,
    showOnboarding: bundle.showOnboarding,
  }
}

function resolveActivationContext(
  activatedParam: string | null
): PremiumActivationContext | null {
  const sessionActivation = peekPremiumActivation()
  if (sessionActivation) return sessionActivation

  if (activatedParam && isKnownPlan(activatedParam)) {
    const planId = activatedParam as SubscriptionPlanId
    return {
      planId,
      planName: planId.charAt(0).toUpperCase() + planId.slice(1),
      previousPlanId: "free",
      activatedAt: Date.now(),
    }
  }

  return null
}

function DashboardPage() {
  const { session } = useAuthSession()
  const userId = session?.userId ?? ""
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activationContext, setActivationContext] = useState<PremiumActivationContext | null>(
    null
  )
  const [showWelcomeCard, setShowWelcomeCard] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const { data, isLoading, isError, error, reload } = useAsyncData(loadDashboard, [])
  const [userSelectedAuditId, setUserSelectedAuditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Audit | null>(null)
  const [pendingPlanCheckoutLoading, setPendingPlanCheckoutLoading] = useState(false)
  const [dismissedBannerUserId, setDismissedBannerUserId] = useState<string | null>(null)
  const pendingPlanBannerDismissed =
    !userId ||
    dismissedBannerUserId === userId ||
    isPendingPlanBannerDismissed(userId)

  const { data: billing } = useAsyncData(
    () => billingService.getBilling(userId),
    [userId],
    { enabled: Boolean(userId) && isBusinessFoundationEnabled() }
  )

  const { data: entitlement } = useAsyncData(
    () => getAuditEntitlement(userId),
    [userId],
    { enabled: Boolean(userId) && isBusinessFoundationEnabled() }
  )

  useEffect(() => {
    const activated = searchParams.get("activated")
    const context = resolveActivationContext(activated)
    if (!context) return

    setActivationContext(context)
    setShowCelebration(true)

    if (userId && shouldShowPremiumWelcome(userId, context.planId)) {
      setShowWelcomeCard(true)
    }

    setSearchParams({}, { replace: true })

    const timerId = window.setTimeout(() => {
      setShowCelebration(false)
    }, 6_000)

    return () => window.clearTimeout(timerId)
  }, [searchParams, setSearchParams, userId])

  const selectedAuditId = useMemo(() => {
    if (!data || data.audits.length === 0) return null

    if (
      userSelectedAuditId &&
      data.audits.some((audit) => audit.id === userSelectedAuditId)
    ) {
      return userSelectedAuditId
    }

    return getDefaultSelectedAuditId(data.audits)
  }, [data, userSelectedAuditId])

  const {
    data: selectedDetail,
    isLoading: detailLoading,
  } = useAsyncData(
    () =>
      selectedAuditId
        ? auditService.getAuditDetail(selectedAuditId)
        : Promise.resolve(null),
    [selectedAuditId],
    { enabled: Boolean(selectedAuditId) }
  )

  const selectedAudit = useMemo(
    () => data?.audits.find((audit) => audit.id === selectedAuditId) ?? null,
    [data?.audits, selectedAuditId]
  )

  const metrics = useMemo(
    () => (data ? mergeMetricsForSelectedAudit(data.metrics, selectedDetail) : []),
    [data, selectedDetail]
  )

  const opportunities: OpportunityItem[] = useMemo(
    () => (selectedDetail ? buildOpportunitiesFromAuditDetail(selectedDetail) : []),
    [selectedDetail]
  )

  const recommendations: Recommendation[] = useMemo(
    () => (selectedDetail ? buildRecommendationsFromAuditDetail(selectedDetail) : []),
    [selectedDetail]
  )

  function handleDismissWelcome() {
    if (userId && activationContext) {
      dismissPremiumWelcome(userId, activationContext.planId)
    }
    setShowWelcomeCard(false)
  }

  const celebrationPlanName = activationContext?.planName ?? "Premium"
  const heroCtaLabel = showCelebration
    ? "Run your first Premium Audit"
    : "Run new audit"

  const header = (
    <AppPageHeader
      eyebrow="Workspace"
      title="Audit dashboard"
      description="Monitor conversion health, prioritize fixes, and track audit outcomes across your funnel."
      actions={
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          {entitlement ? <AuditAllowanceBadge entitlement={entitlement} /> : null}
          <Button size="sm" asChild>
            <Link to={ROUTES.auditNew}>{heroCtaLabel}</Link>
          </Button>
        </div>
      }
    />
  )

  if (isLoading) {
    return (
      <AppPageShell header={header}>
        <PageLoading label="Loading dashboard…" />
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

  async function handlePendingPlanSubscribe() {
    if (!billing?.pendingPlanChange) return
    setPendingPlanCheckoutLoading(true)
    try {
      const mode = await billingService.redirectToCheckout(
        userId,
        billing.pendingPlanChange.planId,
        {
          onCheckoutDismissed: () => setPendingPlanCheckoutLoading(false),
          onCheckoutSuccess: () => {
            navigate(`${ROUTES.billingReturn}?checkout=success`, { replace: true })
          },
        }
      )
      if (mode === "modal") {
        setPendingPlanCheckoutLoading(false)
      }
    } catch (checkoutError) {
      showErrorToast(
        "Checkout failed",
        checkoutError instanceof Error ? checkoutError : new Error("Unable to start checkout")
      )
      setPendingPlanCheckoutLoading(false)
    }
  }

  function handleDismissPendingPlanBanner() {
    dismissPendingPlanBanner(userId)
    setDismissedBannerUserId(userId)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await auditService.deleteAudit(deleteTarget.id)
    setDeleteTarget(null)
    if (userSelectedAuditId === deleteTarget.id) {
      setUserSelectedAuditId(null)
    }
    reload()
  }

  return (
    <AppPageShell header={header}>
      {showCelebration && !showWelcomeCard ? (
        <PremiumCelebrationBanner planName={celebrationPlanName} />
      ) : null}

      {billing?.showPendingPlanCheckout &&
      billing.pendingPlanChange &&
      !pendingPlanBannerDismissed ? (
        <PendingPlanResumeBanner
          pendingPlan={billing.pendingPlanChange}
          isLoading={pendingPlanCheckoutLoading}
          onSubscribe={() => void handlePendingPlanSubscribe()}
          onDismiss={handleDismissPendingPlanBanner}
        />
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

      {data.showOnboarding ? <OnboardingCard /> : null}

      {data.audits.length > 0 ? (
        <CurrentAuditSelector
          audits={data.audits}
          selectedAuditId={selectedAuditId}
          onSelect={setUserSelectedAuditId}
        />
      ) : null}

      <MetricsOverviewSection metrics={metrics} />

      {detailLoading && selectedAuditId ? (
        <PageLoading label="Loading audit insights…" />
      ) : (
        <>
          <DashboardPriorityInsights
            audits={data.audits}
            selectedDetail={selectedDetail}
            opportunities={opportunities}
            recommendations={recommendations}
            auditId={selectedAuditId}
          />
          <OpportunityQueueSection
            items={opportunities}
            auditDomain={selectedAudit?.domain}
            auditId={selectedAuditId}
          />
          <AiRecommendationsSection
            recommendations={recommendations}
            auditDomain={selectedAudit?.domain}
          />
        </>
      )}

      <DraftAuditsSection drafts={data.drafts} onChanged={reload} />

      <RecentAuditsSection audits={data.audits} onDeleteRequest={setDeleteTarget} />

      <DeleteAuditModal
        audit={deleteTarget}
        open={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        onConfirmDelete={handleConfirmDelete}
      />
    </AppPageShell>
  )
}

export default DashboardPage
