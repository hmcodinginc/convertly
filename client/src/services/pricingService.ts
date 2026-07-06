import {
  getPlanEntitlement,
  PAID_PLAN_IDS,
  PLAN_ENTITLEMENTS,
  type PlanEntitlement,
  type SubscriptionPlanId,
} from "@/lib/billingPlans"

/** Convertly-owned plan identifiers. Source of truth: `@/lib/billingPlans`. */
export type { SubscriptionPlanId } from "@/lib/billingPlans"

export type PaidPlanId = Exclude<SubscriptionPlanId, "free">

/** Reserved for future regional pricing overrides. */
export type PricingRegion = "default"

export function isKnownPlan(planId: string): planId is SubscriptionPlanId {
  return planId in PLAN_ENTITLEMENTS
}

export function isPaidPlan(planId: string): planId is PaidPlanId {
  return (PAID_PLAN_IDS as readonly string[]).includes(planId)
}

export function resolvePlan(planId: string): SubscriptionPlanId {
  if (!isKnownPlan(planId)) {
    throw new Error(`Unknown plan: ${planId}`)
  }
  return planId
}

export function assertPaidCheckoutPlan(planId: string): PaidPlanId {
  const resolved = resolvePlan(planId)
  if (resolved === "free") {
    throw new Error("The Free plan does not require checkout.")
  }
  return resolved
}

export function getPlanPricing(
  planId: SubscriptionPlanId,
  _region: PricingRegion = "default"
): PlanEntitlement {
  return getPlanEntitlement(planId)
}

export function listPaidPlans(_region: PricingRegion = "default"): PaidPlanId[] {
  return PAID_PLAN_IDS.filter((planId): planId is PaidPlanId => planId !== "free")
}
