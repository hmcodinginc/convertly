import { parseHtmlDocument } from "@/services/audit/pageContentService"
import { logDiscovery } from "@/services/audit/fetch/auditPipelineLogger"

export const MAX_DISCOVERED_PAGES = 24

export const MAX_CRAWL_DEPTH = 4

export const MAX_LINKS_PER_PAGE = 40

const SKIP_PROTOCOLS = ["mailto:", "tel:", "javascript:", "data:"]

export type ExtractedLink = {
  path: string
  url: string
  href: string
}

export type LinkRejection = {
  href: string
  reason: string
}

export type LinkExtractionResult = {
  source: "prioritized-selectors" | "all-anchors"
  selector: string
  anchorCount: number
  buttonNavCount: number
  extracted: ExtractedLink[]
  rejected: LinkRejection[]
  capped: boolean
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === "") return "/"
  const trimmed = pathname.replace(/\/+$/, "") || "/"
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
}

const DISCOVERY_LINK_SELECTORS = [
  "nav a[href]",
  "header a[href]",
  "footer a[href]",
  "main a[href]",
  "[role='navigation'] a[href]",
  "a[class*='cta' i][href]",
  "a[class*='btn' i][href]",
  "a[class*='button' i][href]",
].join(", ")

function collectLinksFromAnchors(
  baseUrl: string,
  anchors: HTMLAnchorElement[],
  rejected: LinkRejection[]
): ExtractedLink[] {
  const base = new URL(baseUrl)
  const links = new Map<string, ExtractedLink>()

  for (const anchor of anchors) {
    const href = anchor.getAttribute("href")?.trim()
    if (!href) {
      rejected.push({ href: "(empty)", reason: "missing-href" })
      continue
    }

    const lowerHref = href.toLowerCase()
    const skipProtocol = SKIP_PROTOCOLS.find((protocol) => lowerHref.startsWith(protocol))
    if (skipProtocol) {
      rejected.push({ href, reason: `skip-protocol:${skipProtocol.replace(":", "")}` })
      continue
    }

    if (href === "#" || href.startsWith("#")) {
      rejected.push({ href, reason: "hash-only-link" })
      continue
    }

    let resolved: URL
    try {
      resolved = new URL(href, base.origin)
    } catch {
      rejected.push({ href, reason: "invalid-url" })
      continue
    }

    if (resolved.origin !== base.origin) {
      rejected.push({
        href,
        reason: `cross-origin:expected=${base.origin},got=${resolved.origin}`,
      })
      continue
    }

    if (resolved.protocol !== "https:" && resolved.protocol !== "http:") {
      rejected.push({ href, reason: `unsupported-protocol:${resolved.protocol}` })
      continue
    }

    const path = normalizePath(resolved.pathname)
    const url = resolved.toString()

    if (links.has(path)) {
      rejected.push({ href, reason: `duplicate-path:${path}` })
      continue
    }

    links.set(path, { path, url, href })
  }

  return Array.from(links.values())
}

function countJsNavCandidates(document: Document): number {
  const buttonSelectors = [
    "nav button",
    "header button",
    "footer button",
    "[role='navigation'] button",
  ].join(", ")

  return document.querySelectorAll(buttonSelectors).length
}

export function extractDiscoveryLinksForCrawl(
  baseUrl: string,
  html: string,
  maxLinks = MAX_LINKS_PER_PAGE
): ExtractedLink[] {
  const document = parseHtmlDocument(html)
  const rejected: LinkRejection[] = []
  const allAnchors = Array.from(document.querySelectorAll("a[href]")) as HTMLAnchorElement[]
  const links = collectLinksFromAnchors(baseUrl, allAnchors, rejected)
  return links.slice(0, maxLinks)
}

export function extractDiscoveryLinksDetailed(
  baseUrl: string,
  html: string
): LinkExtractionResult {
  const document = parseHtmlDocument(html)
  const rejected: LinkRejection[] = []
  const prioritizedAnchors = Array.from(
    document.querySelectorAll(DISCOVERY_LINK_SELECTORS)
  ) as HTMLAnchorElement[]

  const prioritized = collectLinksFromAnchors(baseUrl, prioritizedAnchors, rejected)

  if (prioritized.length > 0) {
    const limit = MAX_DISCOVERED_PAGES - 1
    const capped = prioritized.length > limit
    const extracted = prioritized.slice(0, limit)

    if (capped) {
      for (const link of prioritized.slice(limit)) {
        rejected.push({ href: link.href, reason: `capped:max=${limit}` })
      }
    }

    return {
      source: "prioritized-selectors",
      selector: DISCOVERY_LINK_SELECTORS,
      anchorCount: prioritizedAnchors.length,
      buttonNavCount: countJsNavCandidates(document),
      extracted,
      rejected,
      capped,
    }
  }

  const allAnchors = Array.from(document.querySelectorAll("a[href]")) as HTMLAnchorElement[]
  const fallbackRejected: LinkRejection[] = []
  const allLinks = collectLinksFromAnchors(baseUrl, allAnchors, fallbackRejected)
  const limit = MAX_DISCOVERED_PAGES - 1
  const capped = allLinks.length > limit
  const extracted = allLinks.slice(0, limit)

  if (capped) {
    for (const link of allLinks.slice(limit)) {
      fallbackRejected.push({ href: link.href, reason: `capped:max=${limit}` })
    }
  }

  return {
    source: "all-anchors",
    selector: "a[href]",
    anchorCount: allAnchors.length,
    buttonNavCount: countJsNavCandidates(document),
    extracted,
    rejected: [...rejected, ...fallbackRejected],
    capped,
  }
}

export function extractDiscoveryLinks(baseUrl: string, html: string): ExtractedLink[] {
  return extractDiscoveryLinksDetailed(baseUrl, html).extracted
}

export function extractSameOriginLinks(baseUrl: string, html: string): ExtractedLink[] {
  const result = extractDiscoveryLinksDetailed(baseUrl, html)
  if (result.source === "all-anchors") {
    return result.extracted
  }

  const document = parseHtmlDocument(html)
  const rejected: LinkRejection[] = []
  const allAnchors = Array.from(document.querySelectorAll("a[href]")) as HTMLAnchorElement[]
  return collectLinksFromAnchors(baseUrl, allAnchors, rejected).slice(0, MAX_DISCOVERED_PAGES - 1)
}

export function extractPageTitle(html: string, fallback = "Page"): string {
  const document = parseHtmlDocument(html)
  const title = document.querySelector("title")?.textContent?.trim()
  if (title) return title

  const h1 = document.querySelector("h1")?.textContent?.trim()
  return h1 || fallback
}

export function logLinkExtractionDiagnostics(baseUrl: string, result: LinkExtractionResult): void {
  logDiscovery("Homepage link extraction", {
    baseUrl,
    source: result.source,
    anchorCount: result.anchorCount,
    buttonNavCount: result.buttonNavCount,
    extractedCount: result.extracted.length,
    rejectedCount: result.rejected.length,
    capped: result.capped,
    robots: "not-checked",
  })

  for (const link of result.extracted) {
    logDiscovery("Link extracted", {
      href: link.href,
      path: link.path,
      url: link.url,
    })
  }

  for (const rejection of result.rejected) {
    logDiscovery("Link rejected", {
      href: rejection.href,
      reason: rejection.reason,
    })
  }

  if (result.buttonNavCount > 0 && result.extracted.length === 0) {
    logDiscovery("JS-rendered navigation suspected", {
      buttonNavCount: result.buttonNavCount,
      hint: "nav uses buttons without href — not crawlable as anchors",
    })
  }
}
