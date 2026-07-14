import { isBusinessFoundationEnabled } from "@/lib/businessFoundation"
import * as authService from "@/services/authService"
import * as billingService from "@/services/billingService"
import { getAuditEntitlement } from "@/services/entitlementService"
import * as workspaceService from "@/services/workspaceService"
import type { VertlyEnrichedContext } from "@/features/vertly/types"

export async function buildVertlyEnrichedContext(
  userId?: string
): Promise<VertlyEnrichedContext | null> {
  if (!userId || !isBusinessFoundationEnabled()) {
    return null
  }

  try {
    const [account, billing, workspace, entitlement] = await Promise.all([
      authService.getAccount(),
      billingService.getBilling(userId),
      workspaceService.getWorkspace(userId),
      getAuditEntitlement(userId),
    ])

    return {
      account: account
        ? {
            firstName: account.firstName,
            lastName: account.lastName,
            fullName: account.fullName,
            email: account.email,
          }
        : null,
      plan: {
        planId: billing.plan.planId,
        planName: billing.plan.name,
        status: billing.plan.status,
        renewalDate: billing.plan.renewalDate,
        cancelAtPeriodEnd: billing.plan.cancelAtPeriodEnd,
      },
      usage: {
        auditsUsed: billing.usage.auditsUsed,
        auditsIncluded: billing.usage.auditsIncluded,
        auditsRemaining: billing.usage.auditsRemaining,
        period: billing.usage.period,
        periodEnd: billing.usage.periodEnd,
      },
      pendingPlan: billing.pendingPlanChange,
      showPendingPlanCheckout: billing.showPendingPlanCheckout,
      scheduledPlanChange: billing.scheduledPlanChange,
      workspace: {
        name: workspace.name,
        domainCount: workspace.domains.length,
        primaryDomain:
          workspace.domains.find((domain) => domain.isPrimary)?.hostname ?? null,
      },
      entitlement: {
        allowed: entitlement.allowed,
        blockedByLimit: entitlement.blockedByLimit,
        periodEndFormatted: entitlement.periodEndFormatted,
      },
    }
  } catch {
    return null
  }
}
