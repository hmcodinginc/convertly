import {
  formatPlanPrice,
  getPlanEntitlement,
  planDisplayName,
  type SubscriptionPlanId,
} from "@/lib/billingPlans"
import { assertBusinessFoundationEnabled } from "@/lib/businessFoundation"
import * as bootstrapRepository from "@/services/repositories/business/bootstrapRepository"
import * as workspaceRepository from "@/services/repositories/business/workspaceRepository"
import { ensureBusinessFoundation } from "@/services/businessBootstrapService"
import type { AuditEntitlementCheck } from "@/types/entitlement"
import { AuditLimitError } from "@/types/billing"

function buildUsage(subscription: NonNullable<Awaited<ReturnType<typeof workspaceRepository.getSubscriptionByWorkspaceId>>>) {
  const entitlement = getPlanEntitlement(subscription.plan)
  const auditsUsed =
    subscription.plan === "free"
      ? subscription.lifetime_audits_used
      : subscription.period_audits_used
  const auditsIncluded = entitlement.auditsPerPeriod
  const auditsRemaining = Math.max(0, auditsIncluded - auditsUsed)

  return {
    planId: subscription.plan,
    planName: planDisplayName(subscription.plan),
    auditsUsed,
    auditsIncluded,
    auditsRemaining,
    period: entitlement.period,
    periodEnd: subscription.current_period_end,
  }
}

export async function getAuditEntitlement(userId: string): Promise<AuditEntitlementCheck> {
  assertBusinessFoundationEnabled()
  const workspaceId = await ensureBusinessFoundation(userId)
  const subscription = await workspaceRepository.getSubscriptionByWorkspaceId(workspaceId)

  if (!subscription) {
    return {
      allowed: false,
      planId: "free",
      auditsUsed: 0,
      auditsIncluded: 2,
      auditsRemaining: 0,
      reason: "Subscription not found.",
    }
  }

  const usage = buildUsage(subscription)
  const activeStatus = subscription.status === "active" || subscription.status === "trialing"

  return {
    allowed: activeStatus && usage.auditsRemaining > 0,
    planId: usage.planId,
    auditsUsed: usage.auditsUsed,
    auditsIncluded: usage.auditsIncluded,
    auditsRemaining: usage.auditsRemaining,
    reason:
      activeStatus && usage.auditsRemaining > 0
        ? undefined
        : usage.auditsRemaining <= 0
          ? "You have used all audits included in your plan."
          : "Your subscription is not active.",
  }
}

export async function assertCanRunAudit(userId: string): Promise<void> {
  const entitlement = await getAuditEntitlement(userId)
  if (entitlement.allowed) return

  throw new AuditLimitError(
    entitlement.reason ?? "Upgrade your plan to run more audits."
  )
}

export async function consumeAuditEntitlement(userId: string): Promise<void> {
  assertBusinessFoundationEnabled()
  const workspaceId = await ensureBusinessFoundation(userId)
  const consumed = await bootstrapRepository.tryConsumeAuditEntitlement(workspaceId)

  if (!consumed) {
    throw new AuditLimitError("You have used all audits included in your plan. Upgrade to continue.")
  }
}

export async function getPlanIdForUser(userId: string): Promise<SubscriptionPlanId> {
  assertBusinessFoundationEnabled()
  const workspaceId = await ensureBusinessFoundation(userId)
  const subscription = await workspaceRepository.getSubscriptionByWorkspaceId(workspaceId)
  return subscription?.plan ?? "free"
}

export function formatPlanLabel(planId: SubscriptionPlanId): string {
  if (planId === "free") return "Free"
  return `${planDisplayName(planId)} · ${formatPlanPrice(planId)}/mo`
}
