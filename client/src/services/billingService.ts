import {
  PAID_PLAN_IDS,
  getEffectivePlanEntitlement,
  type EffectivePlanId,
  type SubscriptionPlanId,
} from "@/lib/billingPlans"
import { setPendingCheckout, markCheckoutExternalNavigation } from "@/lib/checkoutPersistence"
import { clearPaymentNotice } from "@/lib/paymentNoticePersistence"
import { assertBusinessFoundationEnabled } from "@/lib/businessFoundation"
import { env } from "@/lib/env"
import { ensureBusinessFoundation } from "@/services/businessBootstrapService"
import * as paymentClient from "@/services/payment/paymentClient"
import { openRazorpaySubscriptionCheckout } from "@/services/payment/razorpayCheckout"
import * as authService from "@/services/authService"
import * as pricingService from "@/services/pricingService"
import {
  buildPlanUsage,
  resolvePlanForUser,
} from "@/services/planResolutionService"
import * as workspaceRepository from "@/services/repositories/business/workspaceRepository"
import type {
  BillingPlanOption,
  BillingSnapshot,
  CheckoutSessionResult,
  PortalSessionResult,
} from "@/types/billing"

function formatRenewalDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function buildPlanOptions(currentPlanId: EffectivePlanId): BillingPlanOption[] {
  return (["free", ...PAID_PLAN_IDS] as SubscriptionPlanId[]).map((planId) => {
    const plan = pricingService.getPlanPricing(planId)
    return {
      id: planId,
      name: plan.name,
      price: plan.priceUsd === 0 ? "$0" : `$${plan.priceUsd}`,
      priceUsd: plan.priceUsd,
      audits: plan.auditsPerPeriod,
      period: plan.period,
      description: plan.description,
      highlight: planId === currentPlanId,
    }
  })
}

export async function getBilling(userId: string): Promise<BillingSnapshot> {
  assertBusinessFoundationEnabled()
  const workspaceId = await ensureBusinessFoundation(userId)
  const subscription = await workspaceRepository.getSubscriptionByWorkspaceId(workspaceId)

  if (!subscription) {
    throw new Error("Subscription not found.")
  }

  const resolved = await resolvePlanForUser(userId)
  const usage = buildPlanUsage(subscription, resolved)
  const entitlement = getEffectivePlanEntitlement(usage.effectivePlanId)

  return {
    plan: {
      planId: usage.effectivePlanId,
      name: usage.planName,
      price:
        resolved.hasPlanOverride
          ? resolved.effectivePlanId === "internal"
            ? "$0"
            : `$${entitlement.priceUsd}/mo`
          : usage.effectivePlanId === "free"
            ? "$0"
            : `$${entitlement.priceUsd}/mo`,
      interval: resolved.hasPlanOverride
        ? resolved.effectivePlanId === "internal"
          ? "internal access"
          : "per month"
        : usage.effectivePlanId === "free"
          ? "lifetime allowance"
          : "per month",
      renewalDate: formatRenewalDate(subscription.current_period_end),
      status: resolved.hasPlanOverride ? "active" : subscription.status,
      cancelAtPeriodEnd: resolved.hasPlanOverride ? false : subscription.cancel_at_period_end,
    },
    usage: {
      auditsUsed: usage.auditsUsed,
      auditsIncluded: usage.auditsIncluded,
      auditsRemaining: usage.auditsRemaining,
      period: usage.period,
      periodEnd: usage.periodEnd,
    },
    plans: buildPlanOptions(usage.effectivePlanId),
    canUpgrade: !resolved.hasPlanOverride && (usage.effectivePlanId === "free" || usage.auditsRemaining === 0),
    paymentsConfigured: true,
  }
}

export async function createCheckoutSession(
  userId: string,
  planId: SubscriptionPlanId
): Promise<CheckoutSessionResult> {
  assertBusinessFoundationEnabled()
  await ensureBusinessFoundation(userId)
  const paidPlan = pricingService.assertPaidCheckoutPlan(planId)
  return paymentClient.invokeCheckout(paidPlan)
}

export async function createPortalSession(userId: string): Promise<PortalSessionResult> {
  assertBusinessFoundationEnabled()
  await ensureBusinessFoundation(userId)

  const returnUrl = `${env.appUrl || window.location.origin}/billing`
  return paymentClient.invokePortal(returnUrl)
}

export async function cancelSubscriptionAtPeriodEnd(userId: string): Promise<void> {
  assertBusinessFoundationEnabled()
  await ensureBusinessFoundation(userId)
  await paymentClient.invokeCancelSubscription(true)
}

export async function redirectToCheckout(
  userId: string,
  planId: SubscriptionPlanId,
  options?: {
    onCheckoutDismissed?: () => void
    onCheckoutSuccess?: () => void
  }
): Promise<"modal" | "redirect"> {
  const billing = await getBilling(userId)
  const session = await createCheckoutSession(userId, planId)
  const authSession = await authService.getSession()

  clearPaymentNotice()

  setPendingCheckout({
    planId,
    userId,
    previousPlanId: billing.plan.planId,
    startedAt: Date.now(),
  })

  markCheckoutExternalNavigation()

  const canUseCheckoutJs = Boolean(session.subscriptionId && session.keyId)

  if (canUseCheckoutJs) {
    const opened = await openRazorpaySubscriptionCheckout({
      keyId: session.keyId!,
      subscriptionId: session.subscriptionId!,
      customerEmail: authSession?.email,
      customerName: authSession
        ? `${authSession.firstName} ${authSession.lastName}`.trim() || undefined
        : undefined,
      onDismiss: options?.onCheckoutDismissed,
      onSuccess: () => {
        options?.onCheckoutSuccess?.()
      },
    })

    if (opened) {
      return "modal"
    }
  }

  const fallbackUrl = session.shortUrl ?? session.url
  if (!fallbackUrl) {
    throw new Error("Checkout session could not be created.")
  }

  window.location.assign(fallbackUrl)
  return "redirect"
}

export async function redirectToBillingPortal(userId: string): Promise<void> {
  const session = await createPortalSession(userId)
  window.location.assign(session.url)
}
