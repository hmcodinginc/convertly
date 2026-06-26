import type { RenderPageDiagnostics } from "@/services/audit/fetch/types"
import { parseHtmlDocument } from "@/services/audit/pageContentService"

function normalizePath(pathname: string): string {
  if (!pathname || pathname === "") return "/"
  const trimmed = pathname.replace(/\/+$/, "") || "/"
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
}

function humanizeUrlSegment(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

function titleFromPath(path: string): string {
  const normalized = normalizePath(path)
  if (normalized === "/") return "Homepage"

  const segments = normalized.split("/").filter(Boolean)
  if (segments.length === 0) return "Homepage"

  return humanizeUrlSegment(segments[segments.length - 1]!)
}

export function resolvePageDisplayTitle(
  path: string,
  html: string | null,
  options?: {
    contentSource?: "static" | "rendered"
    renderDiagnostics?: RenderPageDiagnostics | null
  }
): string {
  const document = html ? parseHtmlDocument(html) : null
  const rendered = options?.contentSource === "rendered"

  if (rendered) {
    const renderedTitle =
      options?.renderDiagnostics?.documentTitle?.trim() ||
      document?.querySelector("title")?.textContent?.trim()

    const h1 =
      options?.renderDiagnostics?.firstH1?.trim() ||
      document?.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim()

    if (renderedTitle && h1 && renderedTitle !== h1) {
      return h1
    }

    if (renderedTitle) {
      return renderedTitle
    }
  }

  const h1 =
    options?.renderDiagnostics?.firstH1?.trim() ||
    document?.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim()

  if (h1) {
    return h1
  }

  return titleFromPath(path)
}
