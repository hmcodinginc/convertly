import type { SubscriptionPlanId } from "@/lib/billingPlans"
import { isPaidEffectivePlan } from "@/lib/planRank"
import type { SubscriptionRow } from "@/types/businessDatabase"

const ACTIVE_PAID_STATUSES = new Set(["active", "trialing", "past_due", "incomplete"])

export function hasActivePaidRazorpaySubscription(
  subscription: SubscriptionRow | null | undefined
): boolean {
  if (!subscription) return false
  if (subscription.payment_provider !== "razorpay") return false
  if (!subscription.stripe_subscription_id) return false
  if (!isPaidEffectivePlan(subscription.plan)) return false
  return ACTIVE_PAID_STATUSES.has(subscription.status)
}

export function shouldOfferPendingPlanCheckout(
  subscription: SubscriptionRow | null | undefined,
  pendingPlanId: SubscriptionPlanId | null | undefined
): boolean {
  if (!pendingPlanId || pendingPlanId === "free") return false
  return !hasActivePaidRazorpaySubscription(subscription)
}
