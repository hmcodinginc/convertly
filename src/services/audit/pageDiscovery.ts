import { inferPageTypeFromPath } from "@/services/audit/constants"
import {
  extractPageTitle,
  extractSameOriginLinks,
  MAX_DISCOVERED_PAGES,
} from "@/services/audit/linkExtractor"
import { fetchPageRemote } from "@/services/audit/remotePageFetch"
import type { DiscoveredPageCandidate } from "@/types/auditEngine"

export type PageDiscoveryProvider = {
  discover: (baseUrl: string) => Promise<DiscoveredPageCandidate[]>
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

export const linkBasedPageDiscoveryProvider: PageDiscoveryProvider = {
  async discover(baseUrl: string): Promise<DiscoveredPageCandidate[]> {
    const origin = normalizeBaseUrl(baseUrl)
    const homepageUrl = buildPageUrl(origin, "/")
    const homepageFetch = await fetchPageRemote(homepageUrl)

    if (!homepageFetch.ok || !homepageFetch.html || !homepageFetch.contentHash) {
      return []
    }

    const homepagePath = new URL(homepageFetch.finalUrl).pathname || "/"
    const verified: DiscoveredPageCandidate[] = [
      {
        pageType: "homepage",
        path: homepagePath === "" ? "/" : homepagePath,
        url: homepageFetch.finalUrl,
        discoveryStatus: "reachable",
        title: extractPageTitle(homepageFetch.html, "Homepage"),
      },
    ]

    const links = extractSameOriginLinks(homepageFetch.finalUrl, homepageFetch.html)

    for (const link of links) {
      if (verified.length >= MAX_DISCOVERED_PAGES) break

      const normalizedPath = link.path === "" ? "/" : link.path
      if (verified.some((page) => page.path === normalizedPath)) continue

      const pageFetch = await fetchPageRemote(link.url)
      if (!pageFetch.ok || pageFetch.status !== 200 || !pageFetch.html || !pageFetch.contentHash) {
        continue
      }

      if (pageFetch.contentHash === homepageFetch.contentHash) {
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
  provider: PageDiscoveryProvider = linkBasedPageDiscoveryProvider
): Promise<DiscoveredPageCandidate[]> {
  return provider.discover(baseUrl)
}

export { buildPageUrl }
