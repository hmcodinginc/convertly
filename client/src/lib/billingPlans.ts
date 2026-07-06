export type SubscriptionPlanId = "free" | "starter" | "growth" | "scale"

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete"
  | "unpaid"

export type PlanEntitlement = {
  id: SubscriptionPlanId
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

export const PAID_PLAN_IDS: SubscriptionPlanId[] = ["starter", "growth", "scale"]

export function getPlanEntitlement(planId: SubscriptionPlanId): PlanEntitlement {
  return PLAN_ENTITLEMENTS[planId]
}

export function formatPlanPrice(planId: SubscriptionPlanId): string {
  const plan = PLAN_ENTITLEMENTS[planId]
  if (plan.priceUsd === 0) return "$0"
  return `$${plan.priceUsd}`
}

export function planDisplayName(planId: SubscriptionPlanId): string {
  return PLAN_ENTITLEMENTS[planId].name
}
