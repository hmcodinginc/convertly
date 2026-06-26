import { inferPageTypeFromPath } from "@/services/audit/constants"
import { MAX_RENDERED_PAGES } from "@/services/audit/fetch/constants"
import { logDiscovery } from "@/services/audit/fetch/auditPipelineLogger"
import { createAuditFetchContext, type AuditFetchContext } from "@/services/audit/fetch/types"
import { hybridPageAcquire } from "@/services/audit/fetch/hybridPageAcquire"
import {
  extractDiscoveryLinksForCrawl,
  extractPageTitle,
  logLinkExtractionDiagnostics,
  MAX_CRAWL_DEPTH,
  MAX_DISCOVERED_PAGES,
  type ExtractedLink,
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

function normalizePath(pathname: string): string {
  if (!pathname || pathname === "") return "/"
  const trimmed = pathname.replace(/\/+$/, "") || "/"
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
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

type CrawlQueueItem = {
  path: string
  url: string
  depth: number
}

function enqueueLinks(
  queue: CrawlQueueItem[],
  visited: Set<string>,
  queued: Set<string>,
  links: ExtractedLink[],
  depth: number
): void {
  for (const link of links) {
    const path = normalizePath(link.path)
    if (visited.has(path) || queued.has(path)) continue
    queued.add(path)
    queue.push({ path, url: link.url, depth })
  }
}

async function verifyCandidate(
  candidate: CrawlQueueItem,
  context: AuditFetchContext,
  normalizedHomepagePath: string
): Promise<{
  accepted: boolean
  candidate?: DiscoveredPageCandidate
  links: ExtractedLink[]
  reason?: string
}> {
  const forceRender = context.spaMode && context.renderedPageCount < MAX_RENDERED_PAGES

  logDiscovery("Verifying candidate", {
    path: candidate.path,
    url: candidate.url,
    depth: candidate.depth,
    forceRender,
  })

  const pageFetch = await hybridPageAcquire(candidate.url, context, { forceRender })

  if (!pageFetch.ok || pageFetch.status !== 200 || !pageFetch.html || !pageFetch.contentHash) {
    return {
      accepted: false,
      links: [],
      reason: "fetch-failed",
    }
  }

  if (
    shouldSkipAsDuplicate(
      candidate.path,
      normalizedHomepagePath,
      pageFetch.contentHash,
      context.homepageContentHash,
      context.spaMode,
      pageFetch.contentSource
    )
  ) {
    return {
      accepted: false,
      links: [],
      reason: duplicateSkipReason(context.spaMode, pageFetch.contentSource),
    }
  }

  const links =
    candidate.depth < MAX_CRAWL_DEPTH
      ? extractDiscoveryLinksForCrawl(pageFetch.finalUrl, pageFetch.html)
      : []

  return {
    accepted: true,
    candidate: {
      pageType: inferPageTypeFromPath(candidate.path),
      path: candidate.path,
      url: pageFetch.finalUrl,
      discoveryStatus: "reachable",
      title: extractPageTitle(pageFetch.html, "Page"),
    },
    links,
  }
}

export const linkBasedPageDiscoveryProvider: PageDiscoveryProvider = {
  async discover(
    baseUrl: string,
    context: AuditFetchContext = createAuditFetchContext()
  ): Promise<DiscoveredPageCandidate[]> {
    const origin = normalizeBaseUrl(baseUrl)

    logDiscovery("Starting BFS page discovery", {
      baseUrl,
      origin,
      maxPages: MAX_DISCOVERED_PAGES,
      maxDepth: MAX_CRAWL_DEPTH,
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

    const homepagePath = normalizePath(new URL(homepageFetch.finalUrl).pathname)
    const verified: DiscoveredPageCandidate[] = [
      {
        pageType: "homepage",
        path: homepagePath,
        url: homepageFetch.finalUrl,
        discoveryStatus: "reachable",
        title: extractPageTitle(homepageFetch.html, "Homepage"),
      },
    ]

    const visited = new Set<string>([homepagePath])
    const queued = new Set<string>()
    const queue: CrawlQueueItem[] = []

    const homepageLinks = extractDiscoveryLinksForCrawl(homepageFetch.finalUrl, homepageFetch.html)
    logLinkExtractionDiagnostics(homepageFetch.finalUrl, {
      source: "all-anchors",
      selector: "a[href]",
      anchorCount: homepageLinks.length,
      buttonNavCount: 0,
      extracted: homepageLinks,
      rejected: [],
      capped: homepageLinks.length >= MAX_DISCOVERED_PAGES,
    })

    enqueueLinks(queue, visited, queued, homepageLinks, 1)

    while (queue.length > 0 && verified.length < MAX_DISCOVERED_PAGES) {
      const candidate = queue.shift()!
      if (visited.has(candidate.path)) continue

      visited.add(candidate.path)

      const result = await verifyCandidate(candidate, context, homepagePath)

      if (!result.accepted || !result.candidate) {
        logDiscovery("Candidate rejected", {
          path: candidate.path,
          url: candidate.url,
          depth: candidate.depth,
          reason: result.reason ?? "unknown",
        })
        continue
      }

      verified.push(result.candidate)

      logDiscovery("URL verified", {
        path: result.candidate.path,
        url: result.candidate.url,
        pageType: result.candidate.pageType,
        depth: candidate.depth,
      })

      if (candidate.depth < MAX_CRAWL_DEPTH) {
        enqueueLinks(queue, visited, queued, result.links, candidate.depth + 1)
      }
    }

    logDiscovery("Discovery complete", {
      baseUrl,
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
