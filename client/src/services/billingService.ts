import {
  PAID_PLAN_IDS,
  planDisplayName,
  type SubscriptionPlanId,
} from "@/lib/billingPlans"
import { assertBusinessFoundationEnabled } from "@/lib/businessFoundation"
import { env } from "@/lib/env"
import { ensureBusinessFoundation } from "@/services/businessBootstrapService"
import * as paymentClient from "@/services/payment/paymentClient"
import * as pricingService from "@/services/pricingService"
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

function buildPlanOptions(currentPlanId: SubscriptionPlanId): BillingPlanOption[] {
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

  const entitlement = pricingService.getPlanPricing(subscription.plan)
  const auditsUsed =
    subscription.plan === "free"
      ? subscription.lifetime_audits_used
      : subscription.period_audits_used
  const auditsRemaining = Math.max(0, entitlement.auditsPerPeriod - auditsUsed)

  return {
    plan: {
      planId: subscription.plan,
      name: planDisplayName(subscription.plan),
      price:
        subscription.plan === "free"
          ? "$0"
          : `$${entitlement.priceUsd}/mo`,
      interval: subscription.plan === "free" ? "lifetime allowance" : "per month",
      renewalDate: formatRenewalDate(subscription.current_period_end),
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    usage: {
      auditsUsed,
      auditsIncluded: entitlement.auditsPerPeriod,
      auditsRemaining,
      period: entitlement.period,
      periodEnd: subscription.current_period_end,
    },
    plans: buildPlanOptions(subscription.plan),
    canUpgrade: subscription.plan === "free" || auditsRemaining === 0,
    paymentsConfigured: true,
  }
}

export async function createCheckoutSession(
  planId: SubscriptionPlanId
): Promise<CheckoutSessionResult> {
  assertBusinessFoundationEnabled()
  const paidPlan = pricingService.assertPaidCheckoutPlan(planId)
  return paymentClient.invokeCheckout(paidPlan)
}

export async function createPortalSession(): Promise<PortalSessionResult> {
  assertBusinessFoundationEnabled()

  const returnUrl = `${env.appUrl || window.location.origin}/billing`
  return paymentClient.invokePortal(returnUrl)
}

export async function cancelSubscriptionAtPeriodEnd(): Promise<void> {
  assertBusinessFoundationEnabled()
  await paymentClient.invokeCancelSubscription(true)
}

export async function redirectToCheckout(planId: SubscriptionPlanId): Promise<void> {
  const session = await createCheckoutSession(planId)
  window.location.assign(session.url)
}

export async function redirectToBillingPortal(): Promise<void> {
  const session = await createPortalSession()
  window.location.assign(session.url)
}
