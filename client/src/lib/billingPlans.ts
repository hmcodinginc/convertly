export type SubscriptionPlanId = "free" | "starter" | "growth" | "scale"

export type OverridePlanId = "starter" | "growth" | "scale" | "internal"

/** Plan used for entitlements and display after override resolution. */
export type EffectivePlanId = SubscriptionPlanId | "internal"

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete"
  | "unpaid"

export type PlanEntitlement = {
  id: EffectivePlanId
  name: string
  priceUsd: number
  auditsPerPeriod: number
  period: "lifetime" | "month"
  description: string
}

export const PLAN_ENTITLEMENTS: Record<SubscriptionPlanId, PlanEntitlement> = {
  free: {
    id: "free",
    name: "Free",
    priceUsd: 0,
    auditsPerPeriod: 2,
    period: "lifetime",
    description: "2 lifetime audits to explore Convertly",
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceUsd: 29,
    auditsPerPeriod: 10,
    period: "month",
    description: "For solo operators running regular conversion checks",
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceUsd: 100,
    auditsPerPeriod: 30,
    period: "month",
    description: "For growth teams scaling audit volume",
  },
  scale: {
    id: "scale",
    name: "Scale",
    priceUsd: 250,
    auditsPerPeriod: 100,
    period: "month",
    description: "For high-volume conversion programs",
  },
}

const INTERNAL_PLAN_ENTITLEMENT: PlanEntitlement = {
  id: "internal",
  name: "Internal Access",
  priceUsd: 0,
  auditsPerPeriod: 500,
  period: "month",
  description: "HM Coding internal workspace access",
}

export const PAID_PLAN_IDS: SubscriptionPlanId[] = ["starter", "growth", "scale"]

export function getPlanEntitlement(planId: SubscriptionPlanId): PlanEntitlement {
  return PLAN_ENTITLEMENTS[planId]
}

export function getEffectivePlanEntitlement(planId: EffectivePlanId): PlanEntitlement {
  if (planId === "internal") {
    return INTERNAL_PLAN_ENTITLEMENT
  }
  return getPlanEntitlement(planId)
}

export function isOverridePlanId(planId: string): planId is OverridePlanId {
  return planId === "starter" || planId === "growth" || planId === "scale" || planId === "internal"
}

export function formatPlanPrice(planId: SubscriptionPlanId): string {
  const plan = PLAN_ENTITLEMENTS[planId]
  if (plan.priceUsd === 0) return "$0"
  return `$${plan.priceUsd}`
}

export function planDisplayName(planId: EffectivePlanId): string {
  return getEffectivePlanEntitlement(planId).name
}
