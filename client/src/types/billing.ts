import type { EffectivePlanId, SubscriptionPlanId, SubscriptionStatus } from "@/lib/billingPlans"

export type { SubscriptionPlanId, SubscriptionStatus } from "@/lib/billingPlans"

export type BillingPlanSummary = {
  planId: EffectivePlanId
  name: string
  price: string
  interval: string
  renewalDate: string | null
  status: SubscriptionStatus
  cancelAtPeriodEnd: boolean
}

export type ScheduledPlanChange = {
  planId: SubscriptionPlanId
  planName: string
  changeAt: string | null
  changeAtFormatted: string | null
}

export type BillingUsage = {
  auditsUsed: number
  auditsIncluded: number
  auditsRemaining: number
  period: "lifetime" | "month"
  periodEnd: string | null
}

export type BillingPlanOption = {
  id: SubscriptionPlanId
  name: string
  price: string
  priceUsd: number
  audits: number
  period: "lifetime" | "month"
  description: string
  highlight: boolean
}

export type PendingPlanChange = {
  planId: SubscriptionPlanId
  planName: string
}

export type BillingSnapshot = {
  plan: BillingPlanSummary
  usage: BillingUsage
  plans: BillingPlanOption[]
  canUpgrade: boolean
  paymentsConfigured: boolean
  scheduledPlanChange: ScheduledPlanChange | null
  pendingPlanChange: PendingPlanChange | null
  hasActiveRazorpaySubscription: boolean
  showPendingPlanCheckout: boolean
}

export type ChangePlanResult = {
  direction: "upgrade" | "downgrade" | "cancel_scheduled"
  scheduleChangeAt?: "cycle_end"
  targetPlanId?: SubscriptionPlanId
  externalSubscriptionId?: string
  hasScheduledChanges?: boolean
  changeScheduledAt?: string | null
  message: string
}

export type CheckoutSessionResult = {
  url?: string
  subscriptionId?: string
  shortUrl?: string
  keyId?: string
}

export type PortalSessionResult = {
  url: string
}

export class AuditLimitError extends Error {
  readonly code = "AUDIT_LIMIT_REACHED" as const

  constructor(message: string) {
    super(message)
    this.name = "AuditLimitError"
  }
}
