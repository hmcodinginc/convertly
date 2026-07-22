import type { PaidPlanId } from "@/services/pricingService"
import { getSupabaseClient } from "@/services/auth/supabaseClient"
import type { CheckoutSessionResult, ChangePlanResult } from "@/types/billing"

const CHECKOUT_FUNCTION = "payment-checkout"
const CHANGE_PLAN_FUNCTION = "payment-change-plan"
const CANCEL_FUNCTION = "payment-cancel"

/**
 * Payment edge functions return friendly messages in their JSON error body
 * (e.g. PLAN_CHANGE_UNSUPPORTED for UPI/eMandate plan changes), but
 * FunctionsHttpError only exposes a generic message. Read the response body
 * so users see the actual explanation.
 */
async function resolveFunctionErrorMessage(
  error: { message?: string; context?: unknown },
  fallback: string
): Promise<string> {
  const context = error.context
  if (context instanceof Response) {
    try {
      const body = (await context.clone().json()) as { error?: string } | null
      if (body?.error) return body.error
    } catch {
      // Body was not JSON — fall through to the generic message.
    }
  }
  return error.message || fallback
}

export async function invokeCheckout(planId: PaidPlanId): Promise<CheckoutSessionResult> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.functions.invoke<CheckoutSessionResult>(
    CHECKOUT_FUNCTION,
    {
      method: "POST",
      body: { planId },
    }
  )

  if (error) {
    throw new Error(await resolveFunctionErrorMessage(error, "Unable to start checkout."))
  }

  if (!data) {
    throw new Error("Checkout session could not be created.")
  }

  const hasHostedUrl = Boolean(data.url ?? data.shortUrl)
  const hasCheckoutJs = Boolean(data.subscriptionId && data.keyId)

  if (!hasHostedUrl && !hasCheckoutJs) {
    throw new Error("Checkout session could not be created.")
  }

  return data
}

export async function invokeChangePlan(
  planId?: PaidPlanId,
  options?: { cancelScheduled?: boolean }
): Promise<ChangePlanResult> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.functions.invoke<ChangePlanResult>(
    CHANGE_PLAN_FUNCTION,
    {
      method: "POST",
      body: options?.cancelScheduled ? { cancelScheduled: true } : { planId },
    }
  )

  if (error) {
    throw new Error(await resolveFunctionErrorMessage(error, "Unable to change plan."))
  }

  if (!data?.direction) {
    throw new Error("Plan change could not be completed.")
  }

  return data
}

export async function invokeCancelSubscription(
  cancelAtPeriodEnd = true
): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.functions.invoke(CANCEL_FUNCTION, {
    method: "POST",
    body: { cancelAtPeriodEnd },
  })

  if (error) {
    throw new Error(await resolveFunctionErrorMessage(error, "Unable to cancel subscription."))
  }
}
