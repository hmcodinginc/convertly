import type { EffectivePlanId } from "@/lib/billingPlans"
import type { PendingCheckout } from "@/lib/checkoutPersistence"
import type { BillingSnapshot, SubscriptionStatus } from "@/types/billing"

/** Statuses that indicate checkout did not succeed — never treat as verified. */
const CHECKOUT_FAILURE_STATUSES = new Set<SubscriptionStatus>(["canceled", "unpaid"])

function isPaidEffectivePlan(planId: EffectivePlanId): boolean {
  return planId !== "free"
}

function hasCheckoutBlockingStatus(status: SubscriptionStatus): boolean {
  return CHECKOUT_FAILURE_STATUSES.has(status)
}

/**
 * Aligns with BillingPage display truth: the snapshot reflects the purchased upgrade
 * when the effective plan matches the checkout target or moved off the prior plan
 * onto any paid tier (including Razorpay "incomplete" / "past_due" lifecycle states).
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
  if (hasCheckoutBlockingStatus(billing.plan.status)) {
    return false
  }

  return isPaidEffectivePlan(billing.plan.planId)
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
