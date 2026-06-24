import { inferPageTypeFromPath } from "@/services/audit/constants"
import { MAX_RENDERED_PAGES } from "@/services/audit/fetch/constants"
import { logDiscovery } from "@/services/audit/fetch/auditPipelineLogger"
import { createAuditFetchContext, type AuditFetchContext } from "@/services/audit/fetch/types"
import { hybridPageAcquire } from "@/services/audit/fetch/hybridPageAcquire"
import {
  extractDiscoveryLinksDetailed,
  extractPageTitle,
  logLinkExtractionDiagnostics,
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

function duplicateSkipReason(
  spaMode: boolean,
  pageSource: "static" | "rendered"
): string {
  if (spaMode && pageSource === "rendered") {
    return "duplicate-rendered-content-hash"
  }
  return "duplicate-static-content-hash"
}

export const linkBasedPageDiscoveryProvider: PageDiscoveryProvider = {
  async discover(
    baseUrl: string,
    context: AuditFetchContext = createAuditFetchContext()
  ): Promise<DiscoveredPageCandidate[]> {
    const origin = normalizeBaseUrl(baseUrl)

    logDiscovery("Starting page discovery", {
      baseUrl,
      origin,
      maxPages: MAX_DISCOVERED_PAGES,
      robots: "not-checked",
    })

    const homepageUrl = buildPageUrl(origin, "/")
    const homepageFetch = await hybridPageAcquire(homepageUrl, context, { isHomepage: true })

    if (!homepageFetch.ok || !homepageFetch.html || !homepageFetch.contentHash) {
      logDiscovery("Homepage unreachable — discovery aborted", {
        url: homepageUrl,
        ok: homepageFetch.ok,
        status: homepageFetch.status,
        error: homepageFetch.error,
      })
      return []
    }

    logDiscovery("Homepage verified", {
      url: homepageFetch.finalUrl,
      path: new URL(homepageFetch.finalUrl).pathname || "/",
      contentSource: homepageFetch.contentSource,
      contentHash: homepageFetch.contentHash?.slice(0, 12),
      spaMode: context.spaMode,
    })

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

    const linkResult = extractDiscoveryLinksDetailed(homepageFetch.finalUrl, homepageFetch.html)
    logLinkExtractionDiagnostics(homepageFetch.finalUrl, linkResult)

    for (const link of linkResult.extracted) {
      if (verified.length >= MAX_DISCOVERED_PAGES) {
        logDiscovery("Candidate rejected", {
          path: link.path,
          url: link.url,
          reason: `max-pages-reached:${MAX_DISCOVERED_PAGES}`,
        })
        break
      }

      const normalizedPath = link.path === "" ? "/" : link.path
      if (verified.some((page) => page.path === normalizedPath)) {
        logDiscovery("Candidate rejected", {
          path: normalizedPath,
          url: link.url,
          reason: "duplicate-path-already-verified",
        })
        continue
      }

      const forceRender =
        context.spaMode && context.renderedPageCount < MAX_RENDERED_PAGES

      logDiscovery("Verifying candidate", {
        path: normalizedPath,
        url: link.url,
        forceRender,
      })

      const pageFetch = await hybridPageAcquire(link.url, context, { forceRender })

      if (!pageFetch.ok || pageFetch.status !== 200 || !pageFetch.html || !pageFetch.contentHash) {
        logDiscovery("Candidate rejected", {
          path: normalizedPath,
          url: link.url,
          reason: "fetch-failed",
          ok: pageFetch.ok,
          status: pageFetch.status,
          contentSource: pageFetch.contentSource,
          error: pageFetch.error,
        })
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
        logDiscovery("Candidate rejected", {
          path: normalizedPath,
          url: pageFetch.finalUrl,
          reason: duplicateSkipReason(context.spaMode, pageFetch.contentSource),
          pageHash: pageFetch.contentHash?.slice(0, 12),
          homepageHash: context.homepageContentHash?.slice(0, 12),
          contentSource: pageFetch.contentSource,
        })
        continue
      }

      verified.push({
        pageType: inferPageTypeFromPath(normalizedPath),
        path: normalizedPath,
        url: pageFetch.finalUrl,
        discoveryStatus: "reachable",
        title: extractPageTitle(pageFetch.html, "Page"),
      })

      logDiscovery("URL verified", {
        path: normalizedPath,
        url: pageFetch.finalUrl,
        pageType: inferPageTypeFromPath(normalizedPath),
        contentSource: pageFetch.contentSource,
        contentHash: pageFetch.contentHash?.slice(0, 12),
      })
    }

    logDiscovery("Discovery complete", {
      baseUrl,
      homepageContentSource: homepageFetch.contentSource,
      candidatesExtracted: linkResult.extracted.length,
      verifiedPageCount: verified.length,
      paths: verified.map((page) => page.path).join(","),
    })

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
