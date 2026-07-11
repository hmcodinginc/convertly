import type { PendingCheckout } from "@/lib/checkoutPersistence"
import type { BillingSnapshot } from "@/types/billing"

const ACTIVATED_STATUSES = new Set(["active", "trialing"])

export function isPaidSubscriptionActive(billing: BillingSnapshot): boolean {
  return ACTIVATED_STATUSES.has(billing.plan.status) && billing.plan.planId !== "free"
}

export function isSubscriptionActivated(
  billing: BillingSnapshot,
  pending: PendingCheckout
): boolean {
  if (!ACTIVATED_STATUSES.has(billing.plan.status)) return false
  if (billing.plan.planId === pending.planId) return true
  if (
    billing.plan.planId !== pending.previousPlanId &&
    billing.plan.planId !== "free"
  ) {
    return true
  }
  return false
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
