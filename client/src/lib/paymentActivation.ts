import type { EffectivePlanId } from "@/lib/billingPlans"
import type { PendingCheckout } from "@/lib/checkoutPersistence"
import type { BillingSnapshot, SubscriptionStatus } from "@/types/billing"

const ACTIVATED_STATUSES = new Set<SubscriptionStatus>(["active", "trialing"])
const CHECKOUT_FAILURE_STATUSES = new Set<SubscriptionStatus>(["canceled", "unpaid"])

function hasCheckoutBlockingStatus(status: SubscriptionStatus): boolean {
  return CHECKOUT_FAILURE_STATUSES.has(status)
}

function isPaidEffectivePlan(planId: EffectivePlanId): boolean {
  return planId !== "free"
}

/**
 * Pending-checkout verification only: the purchased upgrade is reflected in billing
 * (including Razorpay "incomplete" after subscription.authenticated).
 */
export function billingReflectsPurchasedUpgrade(
  billing: BillingSnapshot,
  pending: PendingCheckout
): boolean {
  if (hasCheckoutBlockingStatus(billing.plan.status)) {
    return false
  }

  const currentPlanId = billing.plan.planId

  if (currentPlanId === pending.planId) {
    return true
  }

  if (
    isPaidEffectivePlan(currentPlanId) &&
    currentPlanId !== pending.previousPlanId &&
    currentPlanId !== "free"
  ) {
    return true
  }

  return false
}

export function isPaidSubscriptionActive(billing: BillingSnapshot): boolean {
  return ACTIVATED_STATUSES.has(billing.plan.status) && billing.plan.planId !== "free"
}

export function isSubscriptionActivated(
  billing: BillingSnapshot,
  pending: PendingCheckout
): boolean {
  return billingReflectsPurchasedUpgrade(billing, pending)
}

export function isCheckoutVerificationComplete(
  billing: BillingSnapshot,
  pending: PendingCheckout | null
): boolean {
  if (pending) {
    return isSubscriptionActivated(billing, pending)
  }

  return isPaidSubscriptionActive(billing)
}
