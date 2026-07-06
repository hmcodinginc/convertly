import type { SubscriptionPlanId } from "@/lib/billingPlans"

export type WorkspaceDomain = {
  id: string
  workspaceId: string
  hostname: string
  isPrimary: boolean
  lastAuditedAt: string | null
  createdAt: string
}

export type WorkspaceUsage = {
  planId: SubscriptionPlanId
  planName: string
  auditsUsed: number
  auditsIncluded: number
  auditsRemaining: number
  period: "lifetime" | "month"
  periodEnd: string | null
}

export type WorkspaceSnapshot = {
  id: string
  name: string
  type: "personal" | "organization"
  domains: WorkspaceDomain[]
  usage: WorkspaceUsage
}

export type CreateDomainInput = {
  hostname: string
  isPrimary?: boolean
}

export type UpdateDomainInput = {
  hostname?: string
  isPrimary?: boolean
}
