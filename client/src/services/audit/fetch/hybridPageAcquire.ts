import { MAX_RENDERED_PAGES } from "@/services/audit/fetch/constants"
import { hashContent } from "@/services/audit/fetch/contentHash"
import { classifyFetchFailure } from "@/services/audit/fetch/fetchErrorClassifier"
import { assessHtmlQuality } from "@/services/audit/fetch/htmlQualityGate"
import { renderPageRemote } from "@/services/audit/fetch/renderPageRemote"
import { fetchPageRemote } from "@/services/audit/remotePageFetch"
import type {
  AcquiredPageContent,
  AuditFetchContext,
  PageAcquisitionDiagnostics,
} from "@/services/audit/fetch/types"
import type { CrawlStage } from "@/services/audit/intelligence/diagnostics/crawlDiagnostics"

const STATIC_FETCH_RETRIES = 2

function cacheKey(url: string): string {
  try {
    return new URL(url).toString()
  } catch {
    return url
  }
}

function buildStaticAcquisitionTrace(
  url: string,
  result: Awaited<ReturnType<typeof fetchPageRemote>>,
  retryAttempts: number
): PageAcquisitionDiagnostics {
  const classified = classifyFetchFailure({
    error: result.error,
    status: result.status,
    html: result.html,
    finalUrl: result.finalUrl,
  })

  const stage: CrawlStage =
    classified.kind === "dns"
      ? "dns"
      : classified.kind === "cloudflare"
        ? "cloudflare"
        : classified.kind === "bot_protection"
          ? "bot_protection"
          : classified.kind === "redirect_loop"
            ? "redirect"
            : classified.kind === "response_too_large"
              ? "static_fetch"
              : classified.kind === "timeout"
                ? "static_fetch"
                : "page_acquisition"

  return {
    url: result.finalUrl || url,
    crawlStage: result.ok ? "page_acquisition" : stage,
    crawlError: result.error,
    httpStatus: result.status || undefined,
    redirectCount: result.finalUrl !== url ? 1 : 0,
    retryAttempts,
    blockedByCloudflare: classified.kind === "cloudflare",
    blockedByBotProtection: classified.kind === "bot_protection",
    timedOut: classified.kind === "timeout",
    javascriptExecuted: false,
    pageAcquired: result.ok && Boolean(result.html),
    renderCompleted: false,
    contentSource: "static",
    navigationStrategy: "static-fetch",
  }
}

function staticToAcquired(
  result: Awaited<ReturnType<typeof fetchPageRemote>>,
  trace: PageAcquisitionDiagnostics
): AcquiredPageContent {
  return {
    ok: result.ok,
    status: result.status,
    finalUrl: result.finalUrl,
    html: result.html,
    contentHash: result.contentHash,
    contentSource: "static",
    error: result.error,
    acquisitionDiagnostics: trace,
  }
}

async function fetchStaticWithRetry(url: string): Promise<{
  result: Awaited<ReturnType<typeof fetchPageRemote>>
  trace: PageAcquisitionDiagnostics
}> {
  let lastResult = await fetchPageRemote(url)
  let trace = buildStaticAcquisitionTrace(url, lastResult, 0)

  for (let attempt = 1; attempt <= STATIC_FETCH_RETRIES && !lastResult.ok; attempt += 1) {
    lastResult = await fetchPageRemote(url)
    trace = buildStaticAcquisitionTrace(url, lastResult, attempt)
  }

  return { result: lastResult, trace }
}

async function renderToAcquired(url: string): Promise<AcquiredPageContent> {
  const rendered = await renderPageRemote(url)

  if (!rendered.ok || !rendered.html) {
    return {
      ok: false,
      status: rendered.acquisitionDiagnostics?.httpStatus ?? 0,
      finalUrl: rendered.finalUrl,
      html: null,
      contentHash: null,
      contentSource: "rendered",
      error: rendered.error ?? "Render failed",
      acquisitionDiagnostics: rendered.acquisitionDiagnostics,
    }
  }

  const contentHash = rendered.contentHash ?? (await hashContent(rendered.html))

  return {
    ok: true,
    status: rendered.acquisitionDiagnostics?.httpStatus ?? 200,
    finalUrl: rendered.finalUrl,
    html: rendered.html,
    contentHash,
    contentSource: "rendered",
    renderDiagnostics: rendered.diagnostics ?? null,
    acquisitionDiagnostics: rendered.acquisitionDiagnostics,
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

  const { result: staticResult, trace: staticTrace } = await fetchStaticWithRetry(url)

  if (!staticResult.ok || !staticResult.html) {
    const staticFailureKind = classifyFetchFailure({
      error: staticResult.error,
      status: staticResult.status,
      html: staticResult.html,
      finalUrl: staticResult.finalUrl,
    }).kind

    const shouldTryRenderOnStaticFailure =
      (options.forceRender || options.isHomepage) &&
      context.renderedPageCount < MAX_RENDERED_PAGES &&
      (staticFailureKind === "response_too_large" ||
        staticFailureKind === "bot_protection" ||
        staticFailureKind === "cloudflare" ||
        staticFailureKind === "timeout" ||
        staticFailureKind === "unreachable" ||
        staticFailureKind === "network" ||
        staticFailureKind === "connection_refused")

    if (shouldTryRenderOnStaticFailure) {
      context.renderedPageCount += 1
      if (options.isHomepage) {
        context.spaMode = true
      }

      const rendered = await renderToAcquired(url)

      if (rendered.ok && rendered.html) {
        context.cache.set(key, rendered)

        if (options.isHomepage) {
          context.homepageContentHash = rendered.contentHash
        }

        return rendered
      }

      const failed = staticToAcquired(staticResult, {
        ...staticTrace,
        crawlError: rendered.error ?? staticResult.error,
        playwrightError: rendered.acquisitionDiagnostics?.playwrightError,
        crawlStage: rendered.acquisitionDiagnostics?.crawlStage ?? staticTrace.crawlStage,
        renderCompleted: false,
      })
      context.cache.set(key, failed)
      return failed
    }

    const failed = staticToAcquired(staticResult, staticTrace)
    context.cache.set(key, failed)
    return failed
  }

  const quality = assessHtmlQuality(staticResult.finalUrl, staticResult.html)

  const shouldAttemptRender =
    options.forceRender ||
    (quality.shouldRender && context.renderedPageCount < MAX_RENDERED_PAGES)

  if (!shouldAttemptRender) {
    const acquired = staticToAcquired(staticResult, {
      ...staticTrace,
      pageAcquired: true,
      crawlStage: "completed",
    })
    context.cache.set(key, acquired)

    if (options.isHomepage) {
      context.homepageContentHash = acquired.contentHash
    }

    return acquired
  }

  if (context.renderedPageCount >= MAX_RENDERED_PAGES) {
    const acquired = staticToAcquired(staticResult, staticTrace)
    context.cache.set(key, acquired)
    return acquired
  }

  context.renderedPageCount += 1

  if (options.isHomepage) {
    context.spaMode = true
  }

  const rendered = await renderToAcquired(url)

  if (rendered.ok && rendered.html) {
    context.cache.set(key, rendered)

    if (options.isHomepage) {
      context.homepageContentHash = rendered.contentHash
    }

    return rendered
  }

  const fallback = staticToAcquired(staticResult, {
    ...staticTrace,
    crawlError: rendered.error ?? staticTrace.crawlError,
    playwrightError: rendered.acquisitionDiagnostics?.playwrightError,
    pageAcquired: true,
    renderCompleted: false,
    crawlStage: rendered.acquisitionDiagnostics?.crawlStage ?? "playwright_render",
  })
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
