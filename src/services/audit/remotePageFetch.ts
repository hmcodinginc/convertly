import { hashContent } from "@/services/audit/fetch/contentHash"
import { getSupabaseClient } from "@/services/auth/supabaseClient"
import { isSupabaseConfigured } from "@/lib/env"

export type RemoteFetchResult = {
  ok: boolean
  status: number
  finalUrl: string
  html: string | null
  contentHash: string | null
  error?: string
}

const AUDIT_FETCH_FUNCTION = "audit-fetch"
const FETCH_TIMEOUT_MS = 12_000

async function fetchPageViaBrowser(url: string): Promise<RemoteFetchResult> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      signal: controller.signal,
      redirect: "follow",
      headers: { Accept: "text/html,application/xhtml+xml" },
    })

    const contentType = response.headers.get("content-type") ?? ""
    const isHtml =
      contentType.includes("text/html") || contentType.includes("application/xhtml")

    if (!response.ok || !isHtml) {
      return {
        ok: false,
        status: response.status,
        finalUrl: response.url || url,
        html: null,
        contentHash: null,
        error: "Unable to fetch HTML in local mode",
      }
    }

    const html = await response.text()
    const contentHash = await hashContent(html)

    return {
      ok: true,
      status: response.status,
      finalUrl: response.url || url,
      html,
      contentHash,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      finalUrl: url,
      html: null,
      contentHash: null,
      error: error instanceof Error ? error.message : "Fetch failed",
    }
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function fetchPageRemote(url: string): Promise<RemoteFetchResult> {
  if (!isSupabaseConfigured()) {
    return fetchPageViaBrowser(url)
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase.functions.invoke<RemoteFetchResult>(
    AUDIT_FETCH_FUNCTION,
    {
      method: "POST",
      body: { url },
    }
  )

  if (error) {
    return {
      ok: false,
      status: 0,
      finalUrl: url,
      html: null,
      contentHash: null,
      error: error.message,
    }
  }

  if (!data) {
    return {
      ok: false,
      status: 0,
      finalUrl: url,
      html: null,
      contentHash: null,
      error: "Empty response from audit fetch",
    }
  }

  if ("error" in data && typeof data.error === "string") {
    return {
      ok: false,
      status: 0,
      finalUrl: url,
      html: null,
      contentHash: null,
      error: data.error,
    }
  }

  return data
}
