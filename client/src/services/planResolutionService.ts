import {
  getEffectivePlanEntitlement,
  planDisplayName,
  type EffectivePlanId,
  type SubscriptionPlanId,
  type SubscriptionStatus,
} from "@/lib/billingPlans"
import type { SubscriptionRow } from "@/types/businessDatabase"
import * as planOverrideRepository from "@/services/repositories/business/planOverrideRepository"
import * as workspaceRepository from "@/services/repositories/business/workspaceRepository"

export type PlanSource = "override" | "subscription"

export type ResolvedPlanContext = {
  effectivePlanId: EffectivePlanId
  source: PlanSource
  hasPlanOverride: boolean
  subscriptionPlan: SubscriptionPlanId
  subscriptionStatus: SubscriptionStatus
}

export type PlanUsageSnapshot = {
  effectivePlanId: EffectivePlanId
  planName: string
  auditsUsed: number
  auditsIncluded: number
  auditsRemaining: number
  period: "lifetime" | "month"
  periodEnd: string | null
  hasPlanOverride: boolean
  subscriptionActive: boolean
}

export async function resolvePlanForUser(userId: string): Promise<ResolvedPlanContext> {
  const [subscription, override] = await Promise.all([
    workspaceRepository.getSubscriptionForUser(userId),
    planOverrideRepository.getActivePlanOverrideByUserId(userId),
  ])

  const subscriptionPlan = subscription?.plan ?? "free"
  const subscriptionStatus = subscription?.status ?? "active"

  if (override) {
    return {
      effectivePlanId: override.override_plan,
      source: "override",
      hasPlanOverride: true,
      subscriptionPlan,
      subscriptionStatus,
    }
  }

  return {
    effectivePlanId: subscriptionPlan,
    source: "subscription",
    hasPlanOverride: false,
    subscriptionPlan,
    subscriptionStatus,
  }
}

export function buildPlanUsage(
  subscription: SubscriptionRow,
  resolved: ResolvedPlanContext
): PlanUsageSnapshot {
  const entitlement = getEffectivePlanEntitlement(resolved.effectivePlanId)
  const usesLifetimeCounter =
    !resolved.hasPlanOverride && resolved.effectivePlanId === "free"
  const auditsUsed = usesLifetimeCounter
    ? subscription.lifetime_audits_used
    : subscription.period_audits_used
  const auditsIncluded = entitlement.auditsPerPeriod
  const auditsRemaining = Math.max(0, auditsIncluded - auditsUsed)
  const subscriptionActive =
    resolved.hasPlanOverride ||
    subscription.status === "active" ||
    subscription.status === "trialing"

  return {
    effectivePlanId: resolved.effectivePlanId,
    planName: planDisplayName(resolved.effectivePlanId),
    auditsUsed,
    auditsIncluded,
    auditsRemaining,
    period: entitlement.period,
    periodEnd: resolved.hasPlanOverride ? null : subscription.current_period_end,
    hasPlanOverride: resolved.hasPlanOverride,
    subscriptionActive,
  }
}

export async function resolvePlanUsageForUser(
  userId: string
): Promise<{ subscription: SubscriptionRow; resolved: ResolvedPlanContext; usage: PlanUsageSnapshot }> {
  const workspace = await workspaceRepository.getPersonalWorkspace(userId)
  if (!workspace) {
    throw new Error("Workspace not found.")
  }

  const subscription = await workspaceRepository.getSubscriptionByWorkspaceId(workspace.id)
  if (!subscription) {
    throw new Error("Subscription not found.")
  }

  const resolved = await resolvePlanForUser(userId)
  const usage = buildPlanUsage(subscription, resolved)

  return { subscription, resolved, usage }
}
