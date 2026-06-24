import { parseHtmlDocument } from "@/services/audit/pageContentService"

export const MAX_DISCOVERED_PAGES = 12

const SKIP_PROTOCOLS = ["mailto:", "tel:", "javascript:", "data:"]

export type ExtractedLink = {
  path: string
  url: string
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === "") return "/"
  const trimmed = pathname.replace(/\/+$/, "") || "/"
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
}

export function extractSameOriginLinks(baseUrl: string, html: string): ExtractedLink[] {
  const base = new URL(baseUrl)
  const document = parseHtmlDocument(html)
  const links = new Map<string, ExtractedLink>()

  for (const anchor of Array.from(document.querySelectorAll("a[href]"))) {
    const href = anchor.getAttribute("href")?.trim()
    if (!href) continue

    const lowerHref = href.toLowerCase()
    if (SKIP_PROTOCOLS.some((protocol) => lowerHref.startsWith(protocol))) continue
    if (href === "#" || href.startsWith("#")) continue

    let resolved: URL
    try {
      resolved = new URL(href, base.origin)
    } catch {
      continue
    }

    if (resolved.origin !== base.origin) continue
    if (resolved.protocol !== "https:" && resolved.protocol !== "http:") continue

    const path = normalizePath(resolved.pathname)
    const url = resolved.protocol === "https:" ? resolved.toString() : resolved.toString()

    if (!links.has(path)) {
      links.set(path, { path, url })
    }
  }

  return Array.from(links.values()).slice(0, MAX_DISCOVERED_PAGES - 1)
}

export function extractPageTitle(html: string, fallback = "Page"): string {
  const document = parseHtmlDocument(html)
  const title = document.querySelector("title")?.textContent?.trim()
  if (title) return title

  const h1 = document.querySelector("h1")?.textContent?.trim()
  return h1 || fallback
}
