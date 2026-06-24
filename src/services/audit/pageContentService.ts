import { fetchPageRemote } from "@/services/audit/remotePageFetch"
import type { AuditPage } from "@/types/auditEngine"

export type PageContentSnapshot = {
  page: AuditPage
  html: string | null
  document: Document | null
  fetchSucceeded: boolean
  status: number | null
  contentHash: string | null
}

export async function fetchPageHtml(url: string): Promise<string | null> {
  const result = await fetchPageRemote(url)
  return result.ok ? result.html : null
}

export function parseHtmlDocument(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html")
}

export async function fetchPageContentSnapshots(
  pages: AuditPage[]
): Promise<PageContentSnapshot[]> {
  const snapshots: PageContentSnapshot[] = []

  for (const page of pages) {
    const result = await fetchPageRemote(page.url)
    const html = result.ok ? result.html : null

    snapshots.push({
      page,
      html,
      document: html ? parseHtmlDocument(html) : null,
      fetchSucceeded: Boolean(result.ok && html),
      status: result.status || null,
      contentHash: result.contentHash,
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
