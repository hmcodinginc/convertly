import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
])

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map((part) => Number(part))
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false
  }

  const [a, b] = parts
  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 192 && b === 168) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  return false
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "")

  if (BLOCKED_HOSTNAMES.has(normalized)) return true
  if (normalized.endsWith(".localhost")) return true
  if (normalized.endsWith(".local")) return true
  if (normalized.endsWith(".internal")) return true
  if (isPrivateIpv4(normalized)) return true

  return false
}

function assertSafeUrl(rawUrl: string): URL {
  let parsed: URL

  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error("Invalid URL")
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are allowed")
  }

  if (!parsed.hostname.includes(".")) {
    throw new Error("Invalid hostname")
  }

  if (isBlockedHostname(parsed.hostname)) {
    throw new Error("Blocked hostname")
  }

  return parsed
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401)
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")
    const workerUrl = Deno.env.get("AUDIT_RENDER_WORKER_URL")

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ error: "Server configuration error" }, 500)
    }

    if (!workerUrl) {
      return jsonResponse({ error: "Render worker is not configured" }, 500)
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

    const body = (await req.json()) as { url?: string }
    if (!body.url?.trim()) {
      return jsonResponse({ error: "URL is required" }, 400)
    }

    const safeUrl = assertSafeUrl(body.url.trim())

    const workerResponse = await fetch(`${workerUrl.replace(/\/$/, "")}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: safeUrl.toString() }),
    })

    const result = await workerResponse.json()

    if (!workerResponse.ok) {
      return jsonResponse(
        {
          ok: false,
          finalUrl: safeUrl.toString(),
          html: null,
          text: null,
          title: null,
          links: [],
          headings: { h1: [], h2: [] },
          contentHash: null,
          rendered: true,
          error: result.error ?? "Render worker failed",
        },
        200
      )
    }

    return jsonResponse(result, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return jsonResponse({ error: message }, 400)
  }
})
