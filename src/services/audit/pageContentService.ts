import type { AuditPage } from "@/types/auditEngine"

export type PageContentSnapshot = {
  page: AuditPage
  html: string | null
  document: Document | null
}

export async function fetchPageHtml(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      signal: controller.signal,
      redirect: "follow",
      headers: { Accept: "text/html" },
    })

    if (!response.ok) return null

    const contentType = response.headers.get("content-type") ?? ""
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return null
    }

    return await response.text()
  } catch {
    return null
  } finally {
    window.clearTimeout(timeout)
  }
}

export function parseHtmlDocument(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html")
}

export async function fetchPageContentSnapshots(
  pages: AuditPage[]
): Promise<PageContentSnapshot[]> {
  const snapshots: PageContentSnapshot[] = []

  for (const page of pages) {
    const html = await fetchPageHtml(page.url)
    snapshots.push({
      page,
      html,
      document: html ? parseHtmlDocument(html) : null,
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
