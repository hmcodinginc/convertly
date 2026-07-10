import {
  authenticateRequest,
  corsHeaders,
  createAdminClient,
  getPaymentProviderId,
  jsonResponse,
  loadWorkspaceContext,
} from "../_shared/payment/common.ts"
import { getPaymentProvider } from "../_shared/payment/index.ts"
import { getRazorpayEnvironment } from "../_shared/payment/razorpayConfig.ts"
import { RazorpayApiError } from "../_shared/payment/providers/razorpay.ts"
import { assertPaidPlan, mapToProviderPlanId } from "../_shared/pricing/index.ts"

type CheckoutRequest = {
  planId?: string
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

    const body = (await req.json()) as CheckoutRequest

    let planId
    try {
      planId = assertPaidPlan(body.planId ?? "")
    } catch {
      return jsonResponse({ error: "Invalid plan." }, 400)
    }

    console.log("[payment-checkout] incoming request", {
      userId: authResult.user.id,
      requestedConvertlyPlan: body.planId ?? null,
      resolvedConvertlyPlan: planId,
    })

    const providerId = getPaymentProviderId()
    const providerPlanId = mapToProviderPlanId(planId, providerId)

    console.log("[payment-checkout] resolved provider plan", {
      convertlyPlan: planId,
      provider: providerId,
      providerPlanId,
    })

    console.log("[payment-checkout] environment", {
      RAZORPAY_ENVIRONMENT: Deno.env.get("RAZORPAY_ENVIRONMENT") ?? null,
      resolvedRazorpayEnvironment: getRazorpayEnvironment(),
    })

    const adminClient = createAdminClient(authResult.supabaseUrl, authResult.serviceRoleKey)

    const workspaceResult = await loadWorkspaceContext(adminClient, authResult.user.id)

    if (workspaceResult instanceof Response) {
      return workspaceResult
    }

    console.log("[payment-checkout] workspace context", {
      workspaceId: workspaceResult.workspaceId,
      userId: authResult.user.id,
      requestedConvertlyPlan: planId,
      subscriptionId: workspaceResult.subscriptionId,
    })

    const provider = getPaymentProvider()

    console.log("[payment-checkout] createCheckout start", {
      workspaceId: workspaceResult.workspaceId,
      userId: authResult.user.id,
      convertlyPlan: planId,
      providerPlanId,
      provider: providerId,
    })

    const checkout = await provider.createCheckout({
      user: authResult.user,
      workspace: workspaceResult,
      planId,
      providerPlanId,
      adminClient,
    })

    console.log("[payment-checkout] createCheckout returned", {
      checkout,
      url: checkout.url,
      subscriptionId: checkout.subscriptionId,
      shortUrl: checkout.shortUrl,
      keyId: checkout.keyId ? `${checkout.keyId.slice(0, 8)}…` : null,
    })

    console.log("[payment-checkout] returning checkout session from provider response", {
      userId: authResult.user.id,
      workspaceId: workspaceResult.workspaceId,
      convertlyPlanId: planId,
      providerPlanId,
      url: checkout.url,
      subscriptionId: checkout.subscriptionId,
      shortUrl: checkout.shortUrl,
      urlSource: checkout.subscriptionId
        ? "razorpay_checkout_js_with_short_url_fallback"
        : "provider_checkout_url",
    })

    return jsonResponse(checkout, 200)
  } catch (error) {
    console.error("[payment-checkout] checkout failed", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined,
      razorpay:
        error instanceof RazorpayApiError
          ? {
              httpStatus: error.httpStatus,
              headers: error.headers,
              rawBody: error.rawBody,
              parsedBody: error.parsedBody,
            }
          : undefined,
      fullError: error,
    })
    const message = error instanceof Error ? error.message : "Unexpected error"
    return jsonResponse({ error: message }, 500)
  }
})
