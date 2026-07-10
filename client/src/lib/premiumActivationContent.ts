import {
  getPlanEntitlement,
  type EffectivePlanId,
  type SubscriptionPlanId,
} from "@/lib/billingPlans"

export type PremiumUnlockItem = {
  id: string
  label: string
}

export function getPremiumUnlockBenefits(planId: SubscriptionPlanId): PremiumUnlockItem[] {
  const plan = getPlanEntitlement(planId)

  switch (planId) {
    case "starter":
      return [
        {
          id: "audits",
          label: `${plan.auditsPerPeriod} monthly audits included`,
        },
        {
          id: "reports",
          label: "Full AI conversion reports on every audit",
        },
        {
          id: "insights",
          label: "Advanced insights and prioritized recommendations",
        },
      ]
    case "growth":
      return [
        {
          id: "audits",
          label: `${plan.auditsPerPeriod} monthly audits for your team`,
        },
        {
          id: "reports",
          label: "Expanded reporting across your full funnel",
        },
        {
          id: "insights",
          label: "Deeper insights for scaling conversion programs",
        },
      ]
    case "scale":
      return [
        {
          id: "audits",
          label: `${plan.auditsPerPeriod} monthly audits at volume`,
        },
        {
          id: "reports",
          label: "Enterprise-grade audit coverage",
        },
        {
          id: "insights",
          label: "Advanced insights for high-volume workflows",
        },
      ]
    default:
      return [
        {
          id: "audits",
          label: `${plan.auditsPerPeriod} audits on your plan`,
        },
        {
          id: "reports",
          label: "Premium audit reports unlocked",
        },
        {
          id: "insights",
          label: "Advanced conversion insights enabled",
        },
      ]
  }
}

export function getPreviousPlanLabel(previousPlanId: EffectivePlanId): string {
  if (previousPlanId === "internal") return "Internal"
  return getPlanEntitlement(previousPlanId).name
}

export function getPremiumWelcomeHeadline(planName: string): string {
  return `${planName} is active`
}

export function getPremiumWelcomeDescription(planName: string): string {
  return `Your workspace is upgraded. Everything on ${planName} is unlocked and ready to use.`
}
