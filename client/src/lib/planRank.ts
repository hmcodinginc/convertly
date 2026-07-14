/** Plan tier ordering for upgrade/downgrade routing (matches server pricingService). */
import type { EffectivePlanId, SubscriptionPlanId } from "@/lib/billingPlans"

const PLAN_RANK: Record<EffectivePlanId, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  scale: 3,
  internal: 0,
}

export type PlanChangeDirection = "upgrade" | "downgrade" | "same"

export function comparePlanRank(a: EffectivePlanId, b: EffectivePlanId): number {
  return PLAN_RANK[a] - PLAN_RANK[b]
}

export function resolvePlanChangeDirection(
  currentPlan: EffectivePlanId,
  targetPlan: SubscriptionPlanId
): PlanChangeDirection {
  const delta = comparePlanRank(currentPlan, targetPlan)
  if (delta === 0) return "same"
  return delta < 0 ? "upgrade" : "downgrade"
}

export function isPaidEffectivePlan(planId: EffectivePlanId): boolean {
  return planId === "starter" || planId === "growth" || planId === "scale"
}
