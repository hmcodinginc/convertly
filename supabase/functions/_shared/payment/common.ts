import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

export type PaymentProviderId = "razorpay" | "stripe"

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-razorpay-signature, stripe-signature",
}

export function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}

export function getAppOrigin(): string {
  return (Deno.env.get("APP_URL") ?? "http://localhost:5173").replace(/\/+$/, "")
}

export function getPaymentProviderId(): PaymentProviderId {
  const provider = Deno.env.get("PAYMENT_PROVIDER") ?? "razorpay"
  if (provider === "stripe" || provider === "razorpay") {
    return provider
  }
  throw new Error(`Unsupported payment provider: ${provider}`)
}

export type AuthenticatedUser = {
  id: string
  email: string | null
}

export type WorkspaceContext = {
  workspaceId: string
  subscriptionId: string
  subscription: Record<string, unknown>
}

export async function authenticateRequest(
  req: Request
): Promise<{ user: AuthenticatedUser; supabaseUrl: string; serviceRoleKey: string } | Response> {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return jsonResponse({ error: "Missing authorization header" }, 401)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration error" }, 500)
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user) {
    return jsonResponse({ error: "Unauthorized" }, 401)
  }

  return {
    user: { id: user.id, email: user.email ?? null },
    supabaseUrl,
    serviceRoleKey,
  }
}

export function createAdminClient(
  supabaseUrl: string,
  serviceRoleKey: string
): SupabaseClient {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function loadWorkspaceContext(
  adminClient: SupabaseClient,
  userId: string
): Promise<WorkspaceContext | Response> {
  const { data: ensuredWorkspaceId, error: ensureError } = await adminClient.rpc(
    "ensure_business_foundation",
    { p_user_id: userId }
  )

  if (ensureError || !ensuredWorkspaceId) {
    console.error("ensure_business_foundation failed", ensureError)
    return jsonResponse({ error: "Unable to initialize workspace." }, 500)
  }

  const { data: workspace, error: workspaceError } = await adminClient
    .from("workspaces")
    .select("id")
    .eq("id", ensuredWorkspaceId)
    .maybeSingle()

  if (workspaceError || !workspace) {
    console.error("workspace lookup failed after ensure", workspaceError)
    return jsonResponse({ error: "Workspace not found." }, 404)
  }

  const { data: subscription, error: subscriptionError } = await adminClient
    .from("subscriptions")
    .select("*")
    .eq("workspace_id", workspace.id)
    .maybeSingle()

  if (subscriptionError || !subscription) {
    return jsonResponse({ error: "Subscription not found." }, 404)
  }

  return {
    workspaceId: workspace.id,
    subscriptionId: subscription.id,
    subscription,
  }
}
