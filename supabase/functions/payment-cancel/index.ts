import {
  authenticateRequest,
  corsHeaders,
  createAdminClient,
  jsonResponse,
  loadWorkspaceContext,
} from "../_shared/payment/common.ts"
import { getPaymentProvider } from "../_shared/payment/index.ts"

type CancelRequest = {
  cancelAtPeriodEnd?: boolean
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

    const body = (await req.json()) as CancelRequest
    const adminClient = createAdminClient(authResult.supabaseUrl, authResult.serviceRoleKey)
    const workspaceResult = await loadWorkspaceContext(adminClient, authResult.user.id)

    if (workspaceResult instanceof Response) {
      return workspaceResult
    }

    const provider = getPaymentProvider()
    await provider.cancelSubscription({
      user: authResult.user,
      workspace: workspaceResult,
      cancelAtPeriodEnd: body.cancelAtPeriodEnd ?? true,
      adminClient,
    })

    return jsonResponse({ canceled: true }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return jsonResponse({ error: message }, 500)
  }
})
