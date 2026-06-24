import { createHash } from "node:crypto"

export function hashContent(value) {
  return createHash("sha256").update(value).digest("hex")
}

function normalizePath(pathname) {
  if (!pathname || pathname === "") return "/"
  const trimmed = pathname.replace(/\/+$/, "") || "/"
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
}

const SKIP_PROTOCOLS = ["mailto:", "tel:", "javascript:", "data:"]

const DISCOVERY_SELECTORS = [
  "nav a[href]",
  "header a[href]",
  "footer a[href]",
  "main a[href]",
  "[role='navigation'] a[href]",
  "a[class*='cta' i][href]",
  "a[class*='btn' i][href]",
  "a[class*='button' i][href]",
  "a[href]",
].join(", ")

export async function extractFromPage(page, baseUrl) {
  return page.evaluate(
    ({ origin, selectors, skipProtocols }) => {
      const links = new Map()
      const anchors = document.querySelectorAll(selectors)

      for (const anchor of anchors) {
        const href = anchor.getAttribute("href")?.trim()
        if (!href) continue

        const lowerHref = href.toLowerCase()
        if (skipProtocols.some((protocol) => lowerHref.startsWith(protocol))) continue
        if (href === "#" || href.startsWith("#")) continue

        let resolved
        try {
          resolved = new URL(href, origin)
        } catch {
          continue
        }

        if (resolved.origin !== origin) continue
        if (resolved.protocol !== "https:" && resolved.protocol !== "http:") continue

        let path = resolved.pathname.replace(/\/+$/, "") || "/"
        if (!path.startsWith("/")) path = `/${path}`

        if (!links.has(path)) {
          links.set(path, { path, url: resolved.toString() })
        }
      }

      const h1 = Array.from(document.querySelectorAll("h1"))
        .map((element) => (element.textContent ?? "").replace(/\s+/g, " ").trim())
        .filter(Boolean)

      const h2 = Array.from(document.querySelectorAll("h2"))
        .map((element) => (element.textContent ?? "").replace(/\s+/g, " ").trim())
        .filter(Boolean)

      const text = (document.body?.innerText ?? "").replace(/\s+/g, " ").trim()

      return {
        links: Array.from(links.values()).slice(0, 11),
        headings: { h1, h2 },
        text,
      }
    },
    {
      origin: new URL(baseUrl).origin,
      selectors: DISCOVERY_SELECTORS,
      skipProtocols: SKIP_PROTOCOLS,
    }
  )
}
