import { MAX_RENDERED_PAGES } from "@/services/audit/fetch/constants"
import { hashContent } from "@/services/audit/fetch/contentHash"
import {
  logPipeline,
  logPlaywright,
  logQuality,
  logStatic,
} from "@/services/audit/fetch/auditPipelineLogger"
import { assessHtmlQuality } from "@/services/audit/fetch/htmlQualityGate"
import { renderPageRemote } from "@/services/audit/fetch/renderPageRemote"
import { fetchPageRemote } from "@/services/audit/remotePageFetch"
import type {
  AcquiredPageContent,
  AuditFetchContext,
} from "@/services/audit/fetch/types"

function cacheKey(url: string): string {
  try {
    return new URL(url).toString()
  } catch {
    return url
  }
}

function staticToAcquired(result: Awaited<ReturnType<typeof fetchPageRemote>>): AcquiredPageContent {
  return {
    ok: result.ok,
    status: result.status,
    finalUrl: result.finalUrl,
    html: result.html,
    contentHash: result.contentHash,
    contentSource: "static",
    error: result.error,
  }
}

async function renderToAcquired(url: string): Promise<AcquiredPageContent> {
  const rendered = await renderPageRemote(url)

  if (!rendered.ok || !rendered.html) {
    return {
      ok: false,
      status: 0,
      finalUrl: rendered.finalUrl,
      html: null,
      contentHash: null,
      contentSource: "rendered",
      error: rendered.error ?? "Render failed",
    }
  }

  const contentHash = rendered.contentHash ?? (await hashContent(rendered.html))

  logPlaywright("Extracted links", {
    url: rendered.finalUrl,
    count: rendered.links.length,
  })

  return {
    ok: true,
    status: 200,
    finalUrl: rendered.finalUrl,
    html: rendered.html,
    contentHash,
    contentSource: "rendered",
    renderDiagnostics: rendered.diagnostics ?? null,
  }
}

type AcquireOptions = {
  forceRender?: boolean
  isHomepage?: boolean
  skipCache?: boolean
}

export async function hybridPageAcquire(
  url: string,
  context: AuditFetchContext,
  options: AcquireOptions = {}
): Promise<AcquiredPageContent> {
  const key = cacheKey(url)
  if (!options.skipCache) {
    const cached = context.cache.get(key)
    if (cached) {
      return cached
    }
  }

  const staticResult = await fetchPageRemote(url)
  logStatic("Fetch complete", {
    url: staticResult.finalUrl,
    ok: staticResult.ok,
    bytes: staticResult.html?.length ?? 0,
  })

  if (!staticResult.ok || !staticResult.html) {
    const failed = staticToAcquired(staticResult)
    context.cache.set(key, failed)
    return failed
  }

  const quality = assessHtmlQuality(staticResult.finalUrl, staticResult.html)

  if (quality.reasons.length > 0) {
    const spaDetected = quality.reasons.some(
      (reason) => reason === "spa-root-detected" || reason === "framework-detected"
    )

    if (spaDetected) {
      logQuality("SPA detected", {
        url: staticResult.finalUrl,
        confidence: quality.confidence,
        reasons: quality.reasons,
      })
    } else {
      logQuality("Assessment complete", {
        url: staticResult.finalUrl,
        confidence: quality.confidence,
        reasons: quality.reasons,
      })
    }
  }

  const shouldAttemptRender =
    options.forceRender ||
    (quality.shouldRender && context.renderedPageCount < MAX_RENDERED_PAGES)

  if (!shouldAttemptRender) {
    const acquired = staticToAcquired(staticResult)
    context.cache.set(key, acquired)

    if (options.isHomepage) {
      context.homepageContentHash = acquired.contentHash
    }

    return acquired
  }

  if (context.renderedPageCount >= MAX_RENDERED_PAGES) {
    logPipeline("Render budget exhausted, using static", { url })
    const acquired = staticToAcquired(staticResult)
    context.cache.set(key, acquired)
    return acquired
  }

  logQuality("Rendering required", {
    url: staticResult.finalUrl,
    confidence: quality.confidence,
    reasons: quality.reasons,
  })

  context.renderedPageCount += 1

  if (options.isHomepage) {
    context.spaMode = true
  }

  const rendered = await renderToAcquired(url)

  if (rendered.ok && rendered.html) {
    logPipeline("Using rendered content", { url: rendered.finalUrl })
    context.cache.set(key, rendered)

    if (options.isHomepage) {
      context.homepageContentHash = rendered.contentHash
    }

    return rendered
  }

  logPipeline("Render failed, using static fallback", {
    url: staticResult.finalUrl,
    error: rendered.error,
  })

  const fallback = staticToAcquired(staticResult)
  context.cache.set(key, fallback)

  if (options.isHomepage) {
    context.homepageContentHash = fallback.contentHash
  }

  return fallback
}

export function getCachedAcquire(
  context: AuditFetchContext,
  url: string
): AcquiredPageContent | undefined {
  return context.cache.get(cacheKey(url))
}
