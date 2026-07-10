import {
  formatPlanPrice,
  planDisplayName,
  type EffectivePlanId,
} from "@/lib/billingPlans"
import { assertBusinessFoundationEnabled } from "@/lib/businessFoundation"
import * as bootstrapRepository from "@/services/repositories/business/bootstrapRepository"
import {
  buildPlanUsage,
  resolvePlanForUser,
} from "@/services/planResolutionService"
import { ensureBusinessFoundation } from "@/services/businessBootstrapService"
import * as workspaceRepository from "@/services/repositories/business/workspaceRepository"
import type { AuditEntitlementCheck } from "@/types/entitlement"
import { AuditLimitError } from "@/types/billing"

export async function getAuditEntitlement(userId: string): Promise<AuditEntitlementCheck> {
  assertBusinessFoundationEnabled()
  await ensureBusinessFoundation(userId)

  const workspace = await workspaceRepository.getPersonalWorkspace(userId)
  if (!workspace) {
    return {
      allowed: false,
      planId: "free",
      auditsUsed: 0,
      auditsIncluded: 2,
      auditsRemaining: 0,
      reason: "Workspace not found.",
    }
  }

  const subscription = await workspaceRepository.getSubscriptionByWorkspaceId(workspace.id)
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

  const resolved = await resolvePlanForUser(userId)
  const usage = buildPlanUsage(subscription, resolved)

  return {
    allowed: usage.subscriptionActive && usage.auditsRemaining > 0,
    planId: usage.effectivePlanId,
    auditsUsed: usage.auditsUsed,
    auditsIncluded: usage.auditsIncluded,
    auditsRemaining: usage.auditsRemaining,
    reason:
      usage.subscriptionActive && usage.auditsRemaining > 0
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

export async function getPlanIdForUser(userId: string): Promise<EffectivePlanId> {
  assertBusinessFoundationEnabled()
  await ensureBusinessFoundation(userId)
  const resolved = await resolvePlanForUser(userId)
  return resolved.effectivePlanId
}

export function formatPlanLabel(planId: EffectivePlanId): string {
  if (planId === "free") return "Free"
  if (planId === "internal") return planDisplayName(planId)
  return `${planDisplayName(planId)} · ${formatPlanPrice(planId)}/mo`
}
