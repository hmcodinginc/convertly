import {
  authenticateRequest,
  corsHeaders,
  createAdminClient,
  getPaymentProviderId,
  jsonResponse,
  loadWorkspaceContext,
} from "../_shared/payment/common.ts"
import { getPaymentProvider } from "../_shared/payment/index.ts"
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

    const providerId = getPaymentProviderId()
    const providerPlanId = mapToProviderPlanId(planId, providerId)

    const adminClient = createAdminClient(authResult.supabaseUrl, authResult.serviceRoleKey)
    const workspaceResult = await loadWorkspaceContext(adminClient, authResult.user.id)

    if (workspaceResult instanceof Response) {
      return workspaceResult
    }

    const provider = getPaymentProvider()
    const checkout = await provider.createCheckout({
      user: authResult.user,
      workspace: workspaceResult,
      planId,
      providerPlanId,
      adminClient,
    })

    return jsonResponse({ url: checkout.url }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return jsonResponse({ error: message }, 500)
  }
})
