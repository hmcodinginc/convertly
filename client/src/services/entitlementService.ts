import {
  formatPlanPrice,
  planDisplayName,
  type EffectivePlanId,
} from "@/lib/billingPlans"
import { assertBusinessFoundationEnabled } from "@/lib/businessFoundation"
import {
  buildPlanUsage,
  resolvePlanForUser,
} from "@/services/planResolutionService"
import { ensureBusinessFoundation } from "@/services/businessBootstrapService"
import * as workspaceRepository from "@/services/repositories/business/workspaceRepository"
import type { AuditEntitlementCheck } from "@/types/entitlement"
import { AuditLimitError } from "@/types/billing"

function formatRenewalDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function buildEntitlementFallback(
  partial: Partial<AuditEntitlementCheck> & Pick<AuditEntitlementCheck, "allowed" | "planId">
): AuditEntitlementCheck {
  return {
    planName: planDisplayName(partial.planId ?? "free"),
    auditsUsed: partial.auditsUsed ?? 0,
    auditsIncluded: partial.auditsIncluded ?? 2,
    auditsRemaining: partial.auditsRemaining ?? 0,
    periodEndFormatted: partial.periodEndFormatted ?? null,
    blockedByLimit: partial.blockedByLimit ?? false,
    reason: partial.reason,
    allowed: partial.allowed,
    planId: partial.planId,
  }
}

export async function getAuditEntitlement(userId: string): Promise<AuditEntitlementCheck> {
  assertBusinessFoundationEnabled()
  await ensureBusinessFoundation(userId)

  const workspace = await workspaceRepository.getPersonalWorkspace(userId)
  if (!workspace) {
    return buildEntitlementFallback({
      allowed: false,
      planId: "free",
      reason: "Workspace not found.",
    })
  }

  const subscription = await workspaceRepository.getSubscriptionByWorkspaceId(workspace.id)
  if (!subscription) {
    return buildEntitlementFallback({
      allowed: false,
      planId: "free",
      reason: "Subscription not found.",
    })
  }

  const resolved = await resolvePlanForUser(userId)
  const usage = buildPlanUsage(subscription, resolved)
  const blockedByLimit = usage.subscriptionActive && usage.auditsRemaining <= 0

  return {
    allowed: usage.subscriptionActive && usage.auditsRemaining > 0,
    planId: usage.effectivePlanId,
    planName: usage.planName,
    auditsUsed: usage.auditsUsed,
    auditsIncluded: usage.auditsIncluded,
    auditsRemaining: usage.auditsRemaining,
    periodEndFormatted: formatRenewalDate(usage.periodEnd),
    blockedByLimit,
    reason:
      usage.subscriptionActive && usage.auditsRemaining > 0
        ? undefined
        : blockedByLimit
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
