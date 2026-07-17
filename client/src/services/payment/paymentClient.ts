import type { PaidPlanId } from "@/services/pricingService"
import { getSupabaseClient } from "@/services/auth/supabaseClient"
import type { CheckoutSessionResult, ChangePlanResult } from "@/types/billing"

const CHECKOUT_FUNCTION = "payment-checkout"
const CHANGE_PLAN_FUNCTION = "payment-change-plan"
const CANCEL_FUNCTION = "payment-cancel"

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
    throw new Error(error.message || "Unable to start checkout.")
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
    throw new Error(error.message || "Unable to change plan.")
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
    throw new Error(error.message || "Unable to cancel subscription.")
  }
}
