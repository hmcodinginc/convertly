import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

import type { ConvertlyPlanId } from "../pricing/catalog.ts"

export type SubscriptionSyncInput = {
  workspaceId: string
  userId: string
  planId: ConvertlyPlanId
  status: string
  externalCustomerId: string | null
  externalSubscriptionId: string | null
  externalPriceId: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  resetPeriodUsage?: boolean
  paymentProvider: string
  scheduledPlan?: ConvertlyPlanId | null
  scheduledChangeAt?: string | null
  clearScheduled?: boolean
}

export function mapProviderStatus(status: string): string {
  switch (status) {
    case "active":
    case "trialing":
      return status
    case "past_due":
    case "unpaid":
    case "incomplete":
    case "canceled":
      return status
    default:
      return "active"
  }
}

export async function syncSubscriptionRecord(
  adminClient: SupabaseClient,
  input: SubscriptionSyncInput
): Promise<void> {
  const update: Record<string, unknown> = {
    plan: input.planId,
    status: mapProviderStatus(input.status),
    stripe_customer_id: input.externalCustomerId,
    stripe_subscription_id: input.externalSubscriptionId,
    stripe_price_id: input.externalPriceId,
    current_period_start: input.currentPeriodStart,
    current_period_end: input.currentPeriodEnd,
    cancel_at_period_end: input.cancelAtPeriodEnd,
    payment_provider: input.paymentProvider,
  }

  if (input.resetPeriodUsage) {
    update.period_audits_used = 0
  }

  if (input.clearScheduled) {
    update.scheduled_plan = null
    update.scheduled_change_at = null
  }

  if (input.scheduledPlan !== undefined) {
    update.scheduled_plan = input.scheduledPlan
  }

  if (input.scheduledChangeAt !== undefined) {
    update.scheduled_change_at = input.scheduledChangeAt
  }

  const payload = Object.fromEntries(
    Object.entries(update).filter(([, value]) => value !== undefined)
  )

  const { error } = await adminClient
    .from("subscriptions")
    .update(payload)
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", input.userId)

  if (error) {
    console.error(
      JSON.stringify({
        scope: "payment-webhook",
        step: "update_subscriptions_failed",
        workspaceId: input.workspaceId,
        userId: input.userId,
        error,
      })
    )
  }
}

export async function syncSubscriptionScheduleOnly(
  adminClient: SupabaseClient,
  input: {
    workspaceId: string
    userId: string
    scheduledPlan: ConvertlyPlanId | null
    scheduledChangeAt: string | null
    currentPeriodEnd?: string | null
  }
): Promise<void> {
  const update: Record<string, unknown> = {
    scheduled_plan: input.scheduledPlan,
    scheduled_change_at: input.scheduledChangeAt,
  }

  if (input.currentPeriodEnd !== undefined) {
    update.current_period_end = input.currentPeriodEnd
  }

  const { error } = await adminClient
    .from("subscriptions")
    .update(update)
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", input.userId)

  if (error) {
    console.error(
      JSON.stringify({
        scope: "payment-webhook",
        step: "update_subscription_schedule_failed",
        workspaceId: input.workspaceId,
        userId: input.userId,
        error,
      })
    )
  }
}

export async function revertToFreePlan(
  adminClient: SupabaseClient,
  workspaceId: string
): Promise<void> {
  await adminClient
    .from("subscriptions")
    .update({
      plan: "free",
      status: "active",
      stripe_subscription_id: null,
      stripe_price_id: null,
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
      scheduled_plan: null,
      scheduled_change_at: null,
      period_audits_used: 0,
    })
    .eq("workspace_id", workspaceId)
}
