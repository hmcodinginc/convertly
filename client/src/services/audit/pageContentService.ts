import { MAX_RENDERED_PAGES } from "@/services/audit/fetch/constants"
import { getCachedAcquire, hybridPageAcquire } from "@/services/audit/fetch/hybridPageAcquire"
import type { AcquiredPageContent, AuditFetchContext, RenderPageDiagnostics } from "@/services/audit/fetch/types"
import { fetchPageRemote } from "@/services/audit/remotePageFetch"
import type { AuditPage } from "@/types/auditEngine"
import { logPageRenderVerification } from "@/services/audit/debug/renderVerificationLog"

export type PageContentSnapshot = {
  page: AuditPage
  html: string | null
  document: Document | null
  fetchSucceeded: boolean
  status: number | null
  contentHash: string | null
  contentSource?: "static" | "rendered"
  finalUrl?: string | null
  renderDiagnostics?: RenderPageDiagnostics | null
  analyzed: boolean
}

export async function fetchPageHtml(
  url: string,
  context?: AuditFetchContext
): Promise<string | null> {
  if (context) {
    const cached = getCachedAcquire(context, url)
    if (cached) {
      return cached.ok ? cached.html : null
    }
    const result = await hybridPageAcquire(url, context)
    return result.ok ? result.html : null
  }

  const result = await fetchPageRemote(url)
  return result.ok ? result.html : null
}

export function parseHtmlDocument(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html")
}

async function acquireForAnalysis(
  page: AuditPage,
  context: AuditFetchContext
): Promise<AcquiredPageContent> {
  const cached = getCachedAcquire(context, page.url)

  if (cached?.ok && cached.contentSource === "rendered" && cached.html) {
    return cached
  }

  if (
    context.spaMode &&
    context.renderedPageCount < MAX_RENDERED_PAGES &&
    (!cached?.ok || cached.contentSource === "static")
  ) {
    return hybridPageAcquire(page.url, context, {
      forceRender: true,
      skipCache: true,
    })
  }

  if (cached) {
    return cached
  }

  const forceRender = context.spaMode && context.renderedPageCount < MAX_RENDERED_PAGES
  return hybridPageAcquire(page.url, context, { forceRender })
}

export async function fetchPageContentSnapshots(
  pages: AuditPage[],
  context?: AuditFetchContext
): Promise<PageContentSnapshot[]> {
  const snapshots: PageContentSnapshot[] = []

  for (const page of pages) {
    let acquired: AcquiredPageContent | undefined

    if (context) {
      acquired = await acquireForAnalysis(page, context)
    } else {
      const result = await fetchPageRemote(page.url)
      acquired = {
        ok: result.ok,
        status: result.status,
        finalUrl: result.finalUrl,
        html: result.html,
        contentHash: result.contentHash,
        contentSource: "static",
        error: result.error,
      }
    }

    const html = acquired.ok ? acquired.html : null
    const fetchSucceeded = Boolean(acquired.ok && html)
    const spaAnalyzable =
      !context?.spaMode || acquired.contentSource === "rendered"

    snapshots.push({
      page,
      html,
      document: html ? parseHtmlDocument(html) : null,
      fetchSucceeded,
      status: acquired.status || null,
      contentHash: acquired.contentHash,
      contentSource: acquired.contentSource,
      finalUrl: acquired.finalUrl,
      renderDiagnostics: acquired.renderDiagnostics ?? null,
      analyzed: fetchSucceeded && spaAnalyzable,
    })

    logPageRenderVerification(snapshots[snapshots.length - 1]!)
  }

  return snapshots
}

export function getHomepageSnapshot(
  snapshots: PageContentSnapshot[]
): PageContentSnapshot | null {
  return (
    snapshots.find((snapshot) => snapshot.page.pageType === "homepage") ??
    snapshots[0] ??
    null
  )
}

export function siteHasReachablePageType(
  pages: AuditPage[],
  pageType: AuditPage["pageType"]
): boolean {
  return pages.some(
    (page) => page.pageType === pageType && page.discoveryStatus === "reachable"
  )
}

export function htmlContainsLinkPattern(html: string | null, patterns: RegExp[]): boolean {
  if (!html) return false
  return patterns.some((pattern) => pattern.test(html))
}

export function getSuccessfulHtml(snapshots: PageContentSnapshot[]): string {
  return snapshots
    .filter((snapshot) => snapshot.fetchSucceeded && snapshot.html)
    .map((snapshot) => snapshot.html!)
    .join("\n")
}

export function getAnalyzedSnapshots(snapshots: PageContentSnapshot[]): PageContentSnapshot[] {
  return snapshots.filter((snapshot) => snapshot.analyzed && snapshot.document)
}
