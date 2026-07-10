import { getSupabaseClient } from "@/services/auth/supabaseClient"
import { isAuditRenderConfigured, isSupabaseConfigured } from "@/lib/env"
import { AUDIT_RENDER_FUNCTION } from "@/services/audit/fetch/constants"
import { logPlaywright } from "@/services/audit/fetch/auditPipelineLogger"
import { classifyFetchFailure } from "@/services/audit/fetch/fetchErrorClassifier"
import type { RenderPageResult } from "@/services/audit/fetch/types"

const RENDER_RETRIES = 2
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])

function failedRender(
  url: string,
  error: string,
  html?: string | null,
  acquisitionDiagnostics?: RenderPageResult["acquisitionDiagnostics"]
): RenderPageResult {
  const userMessage = classifyFetchFailure({ error, html, finalUrl: url }).userMessage
  return {
    ok: false,
    finalUrl: url,
    html: null,
    text: null,
    title: null,
    links: [],
    headings: { h1: [], h2: [] },
    contentHash: null,
    rendered: true,
    error: userMessage,
    acquisitionDiagnostics,
  }
}

function isRetryableRenderFailure(error: string, status?: number): boolean {
  if (status && RETRYABLE_STATUS.has(status)) return true
  const lower = error.toLowerCase()
  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("render request timed out") ||
    lower.includes("active network activity")
  ) {
    return false
  }
  return (
    lower.includes("network") ||
    lower.includes("fetch failed") ||
    lower.includes("empty response")
  )
}

async function renderViaEdgeFunction(url: string): Promise<RenderPageResult> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.functions.invoke<RenderPageResult>(
    AUDIT_RENDER_FUNCTION,
    {
      method: "POST",
      body: { url },
    }
  )

  if (error) {
    return failedRender(url, error.message)
  }

  if (!data) {
    return failedRender(url, "Empty response from audit render")
  }

  if ("error" in data && typeof data.error === "string" && !data.ok) {
    return failedRender(url, data.error, null, data.acquisitionDiagnostics)
  }

  return {
    ...data,
    acquisitionDiagnostics: data.acquisitionDiagnostics,
  }
}

async function renderViaLocalWorker(url: string): Promise<RenderPageResult> {
  const renderUrl = import.meta.env.VITE_AUDIT_RENDER_URL?.trim()
  if (!renderUrl) {
    return failedRender(url, "Render worker URL is not configured")
  }

  const response = await fetch(renderUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })

  const data = (await response.json()) as RenderPageResult & { error?: string }

  if (!response.ok || !data.ok) {
    return failedRender(
      url,
      data.error ?? `Render worker returned ${response.status}`,
      null,
      data.acquisitionDiagnostics
    )
  }

  return data
}

async function renderOnce(url: string): Promise<RenderPageResult> {
  if (isSupabaseConfigured()) {
    return renderViaEdgeFunction(url)
  }

  if (isAuditRenderConfigured()) {
    return renderViaLocalWorker(url)
  }

  return failedRender(url, "Audit render is not configured")
}

export async function renderPageRemote(url: string): Promise<RenderPageResult> {
  logPlaywright("Render requested", { url })

  let lastResult = await renderOnce(url)

  for (let attempt = 1; attempt <= RENDER_RETRIES && !lastResult.ok; attempt += 1) {
    if (!isRetryableRenderFailure(lastResult.error ?? "", lastResult.acquisitionDiagnostics?.httpStatus)) {
      break
    }

    logPlaywright("Render retry", { url, attempt, error: lastResult.error })
    lastResult = await renderOnce(url)
  }

  return lastResult
}
