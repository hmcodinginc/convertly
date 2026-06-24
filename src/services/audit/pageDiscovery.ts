import { inferPageTypeFromPath } from "@/services/audit/constants"
import { MAX_RENDERED_PAGES } from "@/services/audit/fetch/constants"
import { createAuditFetchContext, type AuditFetchContext } from "@/services/audit/fetch/types"
import { hybridPageAcquire } from "@/services/audit/fetch/hybridPageAcquire"
import {
  extractDiscoveryLinks,
  extractPageTitle,
  MAX_DISCOVERED_PAGES,
} from "@/services/audit/linkExtractor"
import type { DiscoveredPageCandidate } from "@/types/auditEngine"

export type PageDiscoveryProvider = {
  discover: (baseUrl: string, context?: AuditFetchContext) => Promise<DiscoveredPageCandidate[]>
}

function buildPageUrl(baseUrl: string, path: string): string {
  const base = new URL(baseUrl)
  if (path === "/") {
    return base.origin
  }
  return new URL(path, base.origin).toString()
}

function normalizeBaseUrl(baseUrl: string): string {
  const parsed = new URL(baseUrl)
  return parsed.origin
}

function shouldSkipAsDuplicate(
  path: string,
  homepagePath: string,
  pageHash: string | null,
  homepageHash: string | null,
  spaMode: boolean,
  pageSource: "static" | "rendered"
): boolean {
  if (path === homepagePath) return true

  if (!pageHash || !homepageHash || pageHash !== homepageHash) {
    return false
  }

  if (spaMode) {
    return pageSource === "rendered"
  }

  return true
}

export const linkBasedPageDiscoveryProvider: PageDiscoveryProvider = {
  async discover(
    baseUrl: string,
    context: AuditFetchContext = createAuditFetchContext()
  ): Promise<DiscoveredPageCandidate[]> {
    const origin = normalizeBaseUrl(baseUrl)
    const homepageUrl = buildPageUrl(origin, "/")
    const homepageFetch = await hybridPageAcquire(homepageUrl, context, { isHomepage: true })

    if (!homepageFetch.ok || !homepageFetch.html || !homepageFetch.contentHash) {
      return []
    }

    const homepagePath = new URL(homepageFetch.finalUrl).pathname || "/"
    const normalizedHomepagePath = homepagePath === "" ? "/" : homepagePath
    const verified: DiscoveredPageCandidate[] = [
      {
        pageType: "homepage",
        path: normalizedHomepagePath,
        url: homepageFetch.finalUrl,
        discoveryStatus: "reachable",
        title: extractPageTitle(homepageFetch.html, "Homepage"),
      },
    ]

    const links = extractDiscoveryLinks(homepageFetch.finalUrl, homepageFetch.html)

    for (const link of links) {
      if (verified.length >= MAX_DISCOVERED_PAGES) break

      const normalizedPath = link.path === "" ? "/" : link.path
      if (verified.some((page) => page.path === normalizedPath)) continue

      const forceRender =
        context.spaMode && context.renderedPageCount < MAX_RENDERED_PAGES

      const pageFetch = await hybridPageAcquire(link.url, context, { forceRender })

      if (!pageFetch.ok || pageFetch.status !== 200 || !pageFetch.html || !pageFetch.contentHash) {
        continue
      }

      if (
        shouldSkipAsDuplicate(
          normalizedPath,
          normalizedHomepagePath,
          pageFetch.contentHash,
          context.homepageContentHash,
          context.spaMode,
          pageFetch.contentSource
        )
      ) {
        continue
      }

      verified.push({
        pageType: inferPageTypeFromPath(normalizedPath),
        path: normalizedPath,
        url: pageFetch.finalUrl,
        discoveryStatus: "reachable",
        title: extractPageTitle(pageFetch.html, "Page"),
      })
    }

    return verified
  },
}

export async function discoverPages(
  baseUrl: string,
  provider: PageDiscoveryProvider = linkBasedPageDiscoveryProvider,
  context?: AuditFetchContext
): Promise<DiscoveredPageCandidate[]> {
  return provider.discover(baseUrl, context)
}

export { buildPageUrl }
