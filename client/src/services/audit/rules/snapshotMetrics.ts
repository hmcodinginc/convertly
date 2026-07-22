import type { RenderPageDiagnostics } from "@/services/audit/fetch/types"
import type { PageContentSnapshot } from "@/services/audit/pageContentService"

export type SnapshotMetrics = {
  pathname: string
  readyState: string | null
  hydrationSettled: boolean
  domSettleMs: number | null
  domLength: number
  visibleTextLength: number
  headingCount: number
  formCount: number
  buttonCount: number
  linkCount: number
  firstH1: string | null
  documentTitle: string | null
  openGraphTitle: string | null
  /** Absolute https og:image URL when present in the already-parsed document */
  openGraphImage: string | null
  /** Absolute https favicon href when present in the already-parsed document */
  faviconUrl: string | null
  hasViewportMeta: boolean
  source: "render-diagnostics" | "dom-fallback"
}

type CoreSnapshotMetrics = Omit<
  SnapshotMetrics,
  "hasViewportMeta" | "source" | "openGraphImage" | "faviconUrl"
>

/** Resolve relative meta/link assets to absolute https URLs only. */
function resolveHttpsAssetUrl(
  raw: string | null | undefined,
  baseUrl: string
): string | null {
  const value = raw?.trim()
  if (!value) return null

  try {
    const resolved = new URL(value, baseUrl)
    if (resolved.protocol !== "https:") return null
    return resolved.href
  } catch {
    return null
  }
}

function readOpenGraphImage(
  document: Document | null,
  baseUrl: string
): string | null {
  const raw =
    document
      ?.querySelector(
        'meta[property="og:image" i], meta[property="og:image:url" i]'
      )
      ?.getAttribute("content") ?? null

  return resolveHttpsAssetUrl(raw, baseUrl)
}

function readFaviconUrl(document: Document | null, baseUrl: string): string | null {
  const raw =
    document?.querySelector('link[rel="icon" i]')?.getAttribute("href") ??
    document?.querySelector('link[rel="shortcut icon" i]')?.getAttribute("href") ??
    document
      ?.querySelector('link[rel="apple-touch-icon" i]')
      ?.getAttribute("href") ??
    null

  return resolveHttpsAssetUrl(raw, baseUrl)
}

function metricsFromDiagnostics(
  diagnostics: RenderPageDiagnostics
): CoreSnapshotMetrics {
  return {
    pathname: diagnostics.pathname,
    readyState: diagnostics.readyState,
    hydrationSettled: diagnostics.hydrationSettled,
    domSettleMs: diagnostics.domSettleMs,
    domLength: diagnostics.domLength,
    visibleTextLength: diagnostics.visibleTextLength,
    headingCount: diagnostics.headingCount,
    formCount: diagnostics.formCount,
    buttonCount: diagnostics.buttonCount,
    linkCount: diagnostics.linkCount,
    firstH1: diagnostics.firstH1,
    documentTitle: diagnostics.documentTitle,
    openGraphTitle: diagnostics.openGraphTitle,
  }
}

function metricsFromDocument(snapshot: PageContentSnapshot): CoreSnapshotMetrics {
  const document = snapshot.document
  const html = snapshot.html ?? ""
  const visibleText = (document?.body?.textContent ?? "").replace(/\s+/g, " ").trim()

  const pathname = (() => {
    try {
      return new URL(snapshot.finalUrl ?? snapshot.page.url).pathname
    } catch {
      return snapshot.page.path
    }
  })()

  return {
    pathname,
    readyState: null,
    hydrationSettled: false,
    domSettleMs: null,
    domLength: html.length,
    visibleTextLength: visibleText.length,
    headingCount: document?.querySelectorAll("h1, h2, h3, h4, h5, h6").length ?? 0,
    formCount: document?.querySelectorAll("form").length ?? 0,
    buttonCount: document?.querySelectorAll("button, [role='button']").length ?? 0,
    linkCount: document?.querySelectorAll("a[href]").length ?? 0,
    firstH1: document?.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim() ?? null,
    documentTitle: document?.querySelector("title")?.textContent?.trim() ?? null,
    openGraphTitle:
      document?.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim() ?? null,
  }
}

/** Unified metrics for rule detectors — prefers Playwright render diagnostics when present */
export function getSnapshotMetrics(snapshot: PageContentSnapshot): SnapshotMetrics {
  const hasViewportMeta = Boolean(snapshot.document?.querySelector("meta[name='viewport' i]"))
  const baseUrl = snapshot.finalUrl ?? snapshot.page.url
  // Same document already parsed for rules — no extra crawl/fetch.
  const openGraphImage = readOpenGraphImage(snapshot.document, baseUrl)
  const faviconUrl = readFaviconUrl(snapshot.document, baseUrl)

  if (snapshot.renderDiagnostics) {
    return {
      ...metricsFromDiagnostics(snapshot.renderDiagnostics),
      openGraphImage,
      faviconUrl,
      hasViewportMeta,
      source: "render-diagnostics",
    }
  }

  return {
    ...metricsFromDocument(snapshot),
    openGraphImage,
    faviconUrl,
    hasViewportMeta,
    source: "dom-fallback",
  }
}

export function getCurrentPageMetrics(context: {
  currentPageSnapshot?: PageContentSnapshot
  pageSnapshots: PageContentSnapshot[]
}): SnapshotMetrics | null {
  const snapshot = context.currentPageSnapshot
  if (!snapshot?.document) return null
  return getSnapshotMetrics(snapshot)
}
