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
  hasViewportMeta: boolean
  source: "render-diagnostics" | "dom-fallback"
}

function metricsFromDiagnostics(diagnostics: RenderPageDiagnostics): Omit<SnapshotMetrics, "hasViewportMeta" | "source"> {
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

function metricsFromDocument(snapshot: PageContentSnapshot): Omit<SnapshotMetrics, "hasViewportMeta" | "source"> {
  const document = snapshot.document
  const html = snapshot.html ?? ""
  const visibleText = (document?.body?.textContent ?? "").replace(/\s+/g, " ").trim()

  let pathname = snapshot.page.path
  try {
    pathname = new URL(snapshot.finalUrl ?? snapshot.page.url).pathname
  } catch {
    pathname = snapshot.page.path
  }

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

  if (snapshot.renderDiagnostics) {
    return {
      ...metricsFromDiagnostics(snapshot.renderDiagnostics),
      hasViewportMeta,
      source: "render-diagnostics",
    }
  }

  return {
    ...metricsFromDocument(snapshot),
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
