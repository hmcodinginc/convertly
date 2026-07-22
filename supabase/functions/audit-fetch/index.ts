import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const FETCH_TIMEOUT_MS = 15_000
const MAX_HTML_BYTES = 5_000_000
const MAX_REDIRECTS = 10

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
])

type FetchResult = {
  ok: boolean
  status: number
  finalUrl: string
  html: string | null
  contentHash: string | null
  error?: string
}

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

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

async function fetchRemotePage(url: string): Promise<FetchResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 ConvertlyAuditBot/1.0",
      },
    })

    const finalUrl = response.url || url
    assertSafeUrl(finalUrl)

    const redirectCount = response.redirected ? 1 : 0
    if (redirectCount > MAX_REDIRECTS) {
      return {
        ok: false,
        status: response.status,
        finalUrl,
        html: null,
        contentHash: null,
        error: "ERR_TOO_MANY_REDIRECTS: Maximum redirect count exceeded",
      }
    }

    const contentType = response.headers.get("content-type") ?? ""
    const path = new URL(finalUrl).pathname.toLowerCase()
    const allowPlainText =
      path === "/robots.txt" ||
      path.endsWith("/robots.txt") ||
      (path.includes("sitemap") && (path.endsWith(".xml") || path.endsWith(".txt")))

    const isHtml =
      contentType.includes("text/html") || contentType.includes("application/xhtml")
    const isText =
      contentType.includes("text/plain") ||
      contentType.includes("text/xml") ||
      contentType.includes("application/xml") ||
      contentType.includes("application/rss")

    if (!isHtml && !(allowPlainText && (isText || contentType === ""))) {
      return {
        ok: false,
        status: response.status,
        finalUrl,
        html: null,
        contentHash: null,
        error: "Response is not HTML",
      }
    }

    const buffer = await response.arrayBuffer()
    if (buffer.byteLength > MAX_HTML_BYTES) {
      return {
        ok: false,
        status: response.status,
        finalUrl,
        html: null,
        contentHash: null,
        error: "Response too large",
      }
    }

    const html = new TextDecoder("utf-8", { fatal: false }).decode(buffer)
    const contentHash = await sha256Hex(html)

    return {
      ok: response.ok,
      status: response.status,
      finalUrl,
      html: response.ok ? html : null,
      contentHash: response.ok ? contentHash : null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fetch failed"
    const normalized =
      message.includes("certificate") || message.includes("SSL") || message.includes("TLS")
        ? `SSL/TLS error: ${message}`
        : message.includes("abort")
          ? "Request timed out"
          : message
    return {
      ok: false,
      status: 0,
      finalUrl: url,
      html: null,
      contentHash: null,
      error: normalized,
    }
  } finally {
    clearTimeout(timeout)
  }
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

    if (!supabaseUrl || !supabaseAnonKey) {
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

    const body = (await req.json()) as { url?: string }
    if (!body.url?.trim()) {
      return jsonResponse({ error: "URL is required" }, 400)
    }

    const safeUrl = assertSafeUrl(body.url.trim())
    const result = await fetchRemotePage(safeUrl.toString())

    return jsonResponse(result, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return jsonResponse({ error: message }, 400)
  }
})
