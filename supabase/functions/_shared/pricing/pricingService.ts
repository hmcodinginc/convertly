import type { PaymentProviderId } from "../payment/common.ts"
import {
  CONVERTLY_PLANS,
  PAID_PLAN_IDS,
  type ConvertlyPlanId,
  type PaidPlanId,
} from "./catalog.ts"

/** Reserved for future regional pricing overrides. */
export type PricingRegion = "default"

export function isKnownPlan(planId: string): planId is ConvertlyPlanId {
  return planId in CONVERTLY_PLANS
}

export function isPaidPlan(planId: string): planId is PaidPlanId {
  return (PAID_PLAN_IDS as readonly string[]).includes(planId)
}

export function resolvePlan(planId: string): ConvertlyPlanId {
  if (!isKnownPlan(planId)) {
    throw new Error(`Unknown plan: ${planId}`)
  }
  return planId
}

export function assertPaidPlan(planId: string): PaidPlanId {
  const resolved = resolvePlan(planId)
  if (resolved === "free") {
    throw new Error("Checkout requires a paid plan.")
  }
  return resolved
}

export function getPlanDefinition(planId: ConvertlyPlanId, _region: PricingRegion = "default") {
  return CONVERTLY_PLANS[planId]
}

function providerPlanEnvKeys(
  provider: PaymentProviderId
): Record<PaidPlanId, string> {
  switch (provider) {
    case "razorpay":
      return {
        starter: "RAZORPAY_PLAN_STARTER",
        growth: "RAZORPAY_PLAN_GROWTH",
        scale: "RAZORPAY_PLAN_SCALE",
      }
    case "stripe":
      return {
        starter: "STRIPE_PRICE_STARTER",
        growth: "STRIPE_PRICE_GROWTH",
        scale: "STRIPE_PRICE_SCALE",
      }
  }
}

function readProviderMappings(
  provider: PaymentProviderId,
  _region: PricingRegion = "default"
): Record<PaidPlanId, string | undefined> {
  const keys = providerPlanEnvKeys(provider)
  return {
    starter: Deno.env.get(keys.starter),
    growth: Deno.env.get(keys.growth),
    scale: Deno.env.get(keys.scale),
  }
}

/** Map a Convertly plan to the active payment provider's external plan/price ID. */
export function mapToProviderPlanId(
  planId: PaidPlanId,
  provider: PaymentProviderId,
  region: PricingRegion = "default"
): string {
  const providerPlanId = readProviderMappings(provider, region)[planId]
  if (!providerPlanId) {
    throw new Error(`Provider plan is not configured for ${planId} (${provider}).`)
  }
  return providerPlanId
}

/** Reverse-map a provider plan/price ID back to a Convertly plan. */
export function mapFromProviderPlanId(
  providerPlanId: string,
  provider: PaymentProviderId,
  region: PricingRegion = "default"
): ConvertlyPlanId | null {
  const mappings = readProviderMappings(provider, region)

  for (const planId of PAID_PLAN_IDS) {
    if (mappings[planId] === providerPlanId) {
      return planId
    }
  }

  return null
}

/** Prefer validated Convertly plan notes; fall back to provider plan ID mapping. */
export function resolvePaidPlanFromSubscription(
  notePlanId: string | undefined,
  providerPlanId: string,
  provider: PaymentProviderId,
  region: PricingRegion = "default"
): PaidPlanId | null {
  if (notePlanId && isPaidPlan(notePlanId)) {
    return notePlanId
  }

  const mapped = mapFromProviderPlanId(providerPlanId, provider, region)
  return mapped && mapped !== "free" ? mapped : null
}
