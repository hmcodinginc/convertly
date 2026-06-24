import { MAX_RENDERED_PAGES } from "@/services/audit/fetch/constants"
import { getCachedAcquire, hybridPageAcquire } from "@/services/audit/fetch/hybridPageAcquire"
import type { AuditFetchContext } from "@/services/audit/fetch/types"
import { fetchPageRemote } from "@/services/audit/remotePageFetch"
import type { AuditPage } from "@/types/auditEngine"

export type PageContentSnapshot = {
  page: AuditPage
  html: string | null
  document: Document | null
  fetchSucceeded: boolean
  status: number | null
  contentHash: string | null
  contentSource?: "static" | "rendered"
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

export async function fetchPageContentSnapshots(
  pages: AuditPage[],
  context?: AuditFetchContext
): Promise<PageContentSnapshot[]> {
  const snapshots: PageContentSnapshot[] = []

  for (const page of pages) {
    let acquired = context ? getCachedAcquire(context, page.url) : undefined

    if (!acquired && context) {
      const forceRender = context.spaMode && context.renderedPageCount < MAX_RENDERED_PAGES
      acquired = await hybridPageAcquire(page.url, context, { forceRender })
    } else if (!acquired) {
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

    snapshots.push({
      page,
      html,
      document: html ? parseHtmlDocument(html) : null,
      fetchSucceeded: Boolean(acquired.ok && html),
      status: acquired.status || null,
      contentHash: acquired.contentHash,
      contentSource: acquired.contentSource,
    })
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
