import {
  getEffectivePlanEntitlement,
  type EffectivePlanId,
} from "@/lib/billingPlans"

export function getPlanFeatureList(planId: EffectivePlanId): string[] {
  const plan = getEffectivePlanEntitlement(planId)
  const auditLabel =
    plan.period === "lifetime"
      ? `${plan.auditsPerPeriod} lifetime audits`
      : `${plan.auditsPerPeriod} audits / month`

  return [
    auditLabel,
    "Full Funnel Audit",
    "Page Specific Audit",
    "Prioritized Recommendations",
    "PDF Reports",
  ]
}
