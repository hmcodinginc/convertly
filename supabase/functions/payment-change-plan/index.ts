import {
  authenticateRequest,
  corsHeaders,
  createAdminClient,
  getPaymentProviderId,
  jsonResponse,
  loadWorkspaceContext,
} from "../_shared/payment/common.ts"
import { RazorpayApiError, razorpayProvider } from "../_shared/payment/providers/razorpay.ts"
import {
  assertPaidPlan,
  mapToProviderPlanId,
  resolvePlan,
  resolvePlanChangeDirection,
} from "../_shared/pricing/index.ts"
import { syncSubscriptionScheduleOnly } from "../_shared/payment/syncSubscription.ts"

type ChangePlanRequest = {
  planId?: string
  cancelScheduled?: boolean
}

const ACTIVE_PAID_STATUSES = new Set(["active", "trialing", "past_due", "incomplete"])

function isActivePaidSubscription(subscription: Record<string, unknown>): boolean {
  const plan = resolvePlan(String(subscription.plan ?? "free"))
  const externalId = subscription.stripe_subscription_id as string | null
  const status = String(subscription.status ?? "")
  return plan !== "free" && Boolean(externalId) && ACTIVE_PAID_STATUSES.has(status)
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  try {
    const authResult = await authenticateRequest(req)
    if (authResult instanceof Response) {
      return authResult
    }

    const body = (await req.json()) as ChangePlanRequest
    const adminClient = createAdminClient(authResult.supabaseUrl, authResult.serviceRoleKey)
    const workspaceResult = await loadWorkspaceContext(adminClient, authResult.user.id)

    if (workspaceResult instanceof Response) {
      return workspaceResult
    }

    const subscription = workspaceResult.subscription
    const externalSubscriptionId = subscription.stripe_subscription_id as string | null

    if (!isActivePaidSubscription(subscription) || !externalSubscriptionId) {
      return jsonResponse(
        {
          error: "No active paid subscription found. Use checkout for new subscriptions.",
          code: "USE_CHECKOUT",
        },
        409
      )
    }

    if (getPaymentProviderId() !== "razorpay") {
      return jsonResponse({ error: "Plan changes are only supported for Razorpay." }, 501)
    }

    if (body.cancelScheduled) {
      const updated = await razorpayProvider.cancelScheduledChanges(externalSubscriptionId)
      const updatedRecord = updated as {
        current_end?: number | null
      }

      await syncSubscriptionScheduleOnly(adminClient, {
        workspaceId: workspaceResult.workspaceId,
        userId: authResult.user.id,
        scheduledPlan: null,
        scheduledChangeAt: null,
        currentPeriodEnd: updatedRecord.current_end
          ? new Date(updatedRecord.current_end * 1000).toISOString()
          : undefined,
      })

      return jsonResponse(
        {
          direction: "cancel_scheduled",
          externalSubscriptionId,
          message: "Scheduled plan change cancelled.",
        },
        200
      )
    }

    let targetPlanId
    try {
      targetPlanId = assertPaidPlan(body.planId ?? "")
    } catch {
      return jsonResponse({ error: "Invalid plan." }, 400)
    }

    const currentPlan = resolvePlan(String(subscription.plan ?? "free"))
    const direction = resolvePlanChangeDirection(currentPlan, targetPlanId)

    if (direction === "same") {
      return jsonResponse({ error: "Already on this plan." }, 400)
    }

    const providerPlanId = mapToProviderPlanId(targetPlanId, "razorpay")
    const scheduleChangeAt = "cycle_end"

    const result = await razorpayProvider.updateSubscription({
      externalSubscriptionId,
      targetPlanId,
      providerPlanId,
      workspaceId: workspaceResult.workspaceId,
      userId: authResult.user.id,
    })

    const resultSubscription = result.subscription as {
      status?: string
      has_scheduled_changes?: boolean
      change_scheduled_at?: number | null
    }

    return jsonResponse(
      {
        direction,
        scheduleChangeAt,
        targetPlanId,
        externalSubscriptionId,
        hasScheduledChanges: resultSubscription.has_scheduled_changes ?? false,
        changeScheduledAt: resultSubscription.change_scheduled_at
          ? new Date(resultSubscription.change_scheduled_at * 1000).toISOString()
          : null,
        message:
          direction === "upgrade"
            ? "Upgrade requested. Your plan will update after payment confirmation."
            : "Downgrade scheduled for the end of your billing period.",
      },
      200
    )
  } catch (error) {
    console.error(
      "[payment-change-plan] failed",
      error instanceof Error ? error.message : error
    )

    if (error instanceof RazorpayApiError && error.httpStatus === 400) {
      return jsonResponse(
        {
          error:
            "This subscription cannot be updated with the selected payment method. Try card checkout or contact support.",
          code: "PLAN_CHANGE_UNSUPPORTED",
        },
        422
      )
    }

    const message = error instanceof Error ? error.message : "Unexpected error"
    return jsonResponse({ error: message }, 500)
  }
})
