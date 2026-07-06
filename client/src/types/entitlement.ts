import type { SubscriptionPlanId } from "@/lib/billingPlans"

export type AuditEntitlementCheck = {
  allowed: boolean
  planId: SubscriptionPlanId
  auditsUsed: number
  auditsIncluded: number
  auditsRemaining: number
  reason?: string
}
