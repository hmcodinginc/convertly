import type { SubscriptionPlanId, SubscriptionStatus } from "@/lib/billingPlans"

export type { SubscriptionPlanId, SubscriptionStatus } from "@/lib/billingPlans"

export type BillingPlanSummary = {
  planId: SubscriptionPlanId
  name: string
  price: string
  interval: string
  renewalDate: string | null
  status: SubscriptionStatus
  cancelAtPeriodEnd: boolean
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

export type BillingSnapshot = {
  plan: BillingPlanSummary
  usage: BillingUsage
  plans: BillingPlanOption[]
  canUpgrade: boolean
  paymentsConfigured: boolean
}

export type CheckoutSessionResult = {
  url: string
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
