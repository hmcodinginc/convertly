import type { EffectivePlanId } from "@/lib/billingPlans"

export type AuditEntitlementCheck = {
  allowed: boolean
  planId: EffectivePlanId
  auditsUsed: number
  auditsIncluded: number
  auditsRemaining: number
  reason?: string
}
