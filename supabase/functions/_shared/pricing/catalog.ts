/**
 * Convertly plan catalog (server mirror).
 * Keep paid-plan metadata in sync with client/src/lib/billingPlans.ts.
 */

export type ConvertlyPlanId = "free" | "starter" | "growth" | "scale"

export type PaidPlanId = Exclude<ConvertlyPlanId, "free">

export type ConvertlyPlanDefinition = {
  id: ConvertlyPlanId
  name: string
  priceUsd: number
  auditsPerPeriod: number
  period: "lifetime" | "month"
  description: string
}

export const CONVERTLY_PLANS: Record<ConvertlyPlanId, ConvertlyPlanDefinition> = {
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

export const PAID_PLAN_IDS: PaidPlanId[] = ["starter", "growth", "scale"]
