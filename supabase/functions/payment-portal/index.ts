import {
  authenticateRequest,
  corsHeaders,
  createAdminClient,
  jsonResponse,
  loadWorkspaceContext,
} from "../_shared/payment/common.ts"
import { getPaymentProvider } from "../_shared/payment/index.ts"

type PortalRequest = {
  returnUrl?: string
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

    const body = (await req.json()) as PortalRequest
    const returnUrl =
      body.returnUrl ??
      `${Deno.env.get("APP_URL") ?? "http://localhost:5173"}/billing`

    const adminClient = createAdminClient(authResult.supabaseUrl, authResult.serviceRoleKey)
    const workspaceResult = await loadWorkspaceContext(adminClient, authResult.user.id)

    if (workspaceResult instanceof Response) {
      return workspaceResult
    }

    const provider = getPaymentProvider()
    const portal = await provider.getCustomerPortal({
      user: authResult.user,
      workspace: workspaceResult,
      returnUrl,
      adminClient,
    })

    return jsonResponse({ url: portal.url }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return jsonResponse({ error: message }, 500)
  }
})
