import { getSupabaseClient } from "@/services/auth/supabaseClient"
import { isAuditRenderConfigured, isSupabaseConfigured } from "@/lib/env"
import { AUDIT_RENDER_FUNCTION } from "@/services/audit/fetch/constants"
import { logPlaywright } from "@/services/audit/fetch/auditPipelineLogger"
import type { RenderPageResult } from "@/services/audit/fetch/types"

function failedRender(url: string, error: string): RenderPageResult {
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
    error,
  }
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

  if ("error" in data && typeof data.error === "string") {
    return failedRender(url, data.error)
  }

  return data
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

  if (!response.ok) {
    return failedRender(url, data.error ?? `Render worker returned ${response.status}`)
  }

  return data
}

export async function renderPageRemote(url: string): Promise<RenderPageResult> {
  logPlaywright("Render requested", { url })

  if (isSupabaseConfigured()) {
    return renderViaEdgeFunction(url)
  }

  if (isAuditRenderConfigured()) {
    return renderViaLocalWorker(url)
  }

  return failedRender(url, "Audit render is not configured")
}
