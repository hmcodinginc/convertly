import type { EffectivePlanId } from "@/lib/billingPlans"

export type AuditEntitlementCheck = {
  allowed: boolean
  planId: EffectivePlanId
  planName: string
  auditsUsed: number
  auditsIncluded: number
  auditsRemaining: number
  periodEndFormatted: string | null
  blockedByLimit: boolean
  reason?: string
}
