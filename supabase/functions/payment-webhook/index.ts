import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

import { corsHeaders, jsonResponse } from "../_shared/payment/common.ts"
import { getPaymentProvider } from "../_shared/payment/index.ts"

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  try {
    const provider = getPaymentProvider()
    const event = await provider.verifyWebhook(req)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Server configuration error" }, 500)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    await provider.handleWebhookEvent(adminClient, event)

    return jsonResponse({ received: true }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed"
    console.error(message)
    return jsonResponse({ error: message }, 400)
  }
})
