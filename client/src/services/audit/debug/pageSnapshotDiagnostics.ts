import type { RenderPageDiagnostics } from "@/services/audit/fetch/types"
import type { PageContentSnapshot } from "@/services/audit/pageContentService"

export type PageTitleSources = {
  h1: string | null
  openGraphTitle: string | null
  documentTitle: string | null
  lastUrlSegment: string | null
  storedPageTitle: string
}

export type PageDomMetrics = {
  domLength: number
  visibleTextLength: number
  headingCount: number
  formCount: number
  buttonCount: number
  linkCount: number
  firstH1: string | null
  domPreview500: string
}

export type PageAnalysisGateResult = {
  passed: boolean
  pathnameMatch: boolean
  pathnameReason: string
  hydrationPassed: boolean
  hydrationReason: string
}

export function normalizeAuditPath(pathname: string): string {
  if (!pathname || pathname === "") return "/"
  const trimmed = pathname.replace(/\/+$/, "") || "/"
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
}

function visibleTextFromDocument(document: Document): string {
  return (document.body?.textContent ?? "").replace(/\s+/g, " ").trim()
}

export function extractDomMetrics(html: string | null, document: Document | null): PageDomMetrics {
  if (!html || !document) {
    return {
      domLength: 0,
      visibleTextLength: 0,
      headingCount: 0,
      formCount: 0,
      buttonCount: 0,
      linkCount: 0,
      firstH1: null,
      domPreview500: "",
    }
  }

  const visibleText = visibleTextFromDocument(document)

  return {
    domLength: html.length,
    visibleTextLength: visibleText.length,
    headingCount: document.querySelectorAll("h1, h2, h3, h4, h5, h6").length,
    formCount: document.querySelectorAll("form").length,
    buttonCount: document.querySelectorAll("button, [role='button']").length,
    linkCount: document.querySelectorAll("a[href]").length,
    firstH1: document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim() ?? null,
    domPreview500: html.slice(0, 500),
  }
}

export function extractTitleSources(
  pagePath: string,
  storedTitle: string,
  document: Document | null
): PageTitleSources {
  const segments = normalizeAuditPath(pagePath).split("/").filter(Boolean)
  const lastSegment = segments.length > 0 ? segments[segments.length - 1] : null

  if (!document) {
    return {
      h1: null,
      openGraphTitle: null,
      documentTitle: null,
      lastUrlSegment: lastSegment,
      storedPageTitle: storedTitle,
    }
  }

  return {
    h1: document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim() ?? null,
    openGraphTitle:
      document.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim() ?? null,
    documentTitle: document.querySelector("title")?.textContent?.trim() ?? null,
    lastUrlSegment: lastSegment,
    storedPageTitle: storedTitle,
  }
}

export function verifyPageAnalysisGate(snapshot: PageContentSnapshot): PageAnalysisGateResult {
  const requestedPath = normalizeAuditPath(snapshot.page.path)
  const finalUrl = snapshot.finalUrl ?? snapshot.page.url

  let finalPathname: string
  try {
    finalPathname = normalizeAuditPath(new URL(finalUrl).pathname)
  } catch {
    return {
      passed: false,
      pathnameMatch: false,
      pathnameReason: `invalid final URL: ${finalUrl}`,
      hydrationPassed: false,
      hydrationReason: "skipped — pathname check failed",
    }
  }

  const browserPathname = snapshot.renderDiagnostics?.pathname
    ? normalizeAuditPath(snapshot.renderDiagnostics.pathname)
    : null

  let pathnameMatch = finalPathname === requestedPath
  let pathnameReason = pathnameMatch
    ? "final URL pathname matches requested path"
    : `final URL pathname ${finalPathname} != requested ${requestedPath}`

  if (browserPathname) {
    if (browserPathname !== requestedPath) {
      pathnameMatch = false
      pathnameReason = `browser pathname ${browserPathname} != requested ${requestedPath}`
    } else {
      pathnameMatch = true
      pathnameReason = "browser pathname matches requested path"
    }
  }

  if (!pathnameMatch) {
    return {
      passed: false,
      pathnameMatch: false,
      pathnameReason,
      hydrationPassed: false,
      hydrationReason: "skipped — pathname check failed",
    }
  }

  if (snapshot.contentSource !== "rendered") {
    return {
      passed: false,
      pathnameMatch: true,
      pathnameReason,
      hydrationPassed: false,
      hydrationReason: "content source is static — browser render required for SPA analysis",
    }
  }

  const diagnostics = snapshot.renderDiagnostics
  if (!diagnostics) {
    return {
      passed: false,
      pathnameMatch: true,
      pathnameReason,
      hydrationPassed: false,
      hydrationReason: "no render diagnostics returned from worker",
    }
  }

  if (diagnostics.readyState !== "complete") {
    return {
      passed: false,
      pathnameMatch: true,
      pathnameReason,
      hydrationPassed: false,
      hydrationReason: `document.readyState is "${diagnostics.readyState}", expected "complete"`,
    }
  }

  if (!diagnostics.hydrationSettled) {
    return {
      passed: false,
      pathnameMatch: true,
      pathnameReason,
      hydrationPassed: false,
      hydrationReason: `DOM did not stabilize within ${diagnostics.domSettleMs}ms settle window`,
    }
  }

  return {
    passed: true,
    pathnameMatch: true,
    pathnameReason,
    hydrationPassed: true,
    hydrationReason: `readyState=complete, DOM stabilized in ${diagnostics.domSettleMs}ms`,
  }
}

export type PageAnalysisReport = {
  snapshot: PageContentSnapshot
  gate: PageAnalysisGateResult
  metrics: PageDomMetrics
  titleSources: PageTitleSources
  rulesExecuted: number
  findingCount: number
  analysisFailed: boolean
  failureReason?: string
}

export function printPageAnalysisReport(report: PageAnalysisReport): void {
  const { snapshot, gate, metrics, titleSources } = report
  const diagnostics = snapshot.renderDiagnostics
  const requestedPath = normalizeAuditPath(snapshot.page.path)
  const finalUrl = snapshot.finalUrl ?? snapshot.page.url

  const lines = [
    "========================================",
    "",
    "Requested:",
    requestedPath,
    "",
    "Final:",
    finalUrl,
    "",
    "Pathname:",
    diagnostics?.pathname ?? `(not from browser — inferred ${normalizeAuditPath(new URL(finalUrl).pathname)})`,
    "",
    "Title:",
    titleSources.documentTitle ?? "(none)",
    "",
    "H1:",
    metrics.firstH1 ?? "(none)",
    "",
    "Content source:",
    snapshot.contentSource ?? "unknown",
    "",
    "DOM:",
    `${metrics.domLength} chars`,
    "",
    "Visible text:",
    `${metrics.visibleTextLength} chars`,
    "",
    "Headings:",
    String(metrics.headingCount),
    "",
    "Forms:",
    String(metrics.formCount),
    "",
    "Buttons:",
    String(metrics.buttonCount),
    "",
    "Links:",
    String(metrics.linkCount),
    "",
    "Pathname check:",
    gate.pathnameMatch ? "PASS" : "FAIL",
    gate.pathnameReason,
    "",
    "Hydration check:",
    gate.hydrationPassed ? "PASS" : "FAIL",
    gate.hydrationReason,
    "",
    "ReadyState:",
    diagnostics?.readyState ?? "n/a (static fetch)",
    "",
    "DOM settle:",
    diagnostics ? `${diagnostics.domSettleMs}ms` : "n/a",
    "",
    "Title sources (TASK 5 — not applied to UI):",
    `  H1: ${titleSources.h1 ?? "(none)"}`,
    `  OpenGraph: ${titleSources.openGraphTitle ?? "(none)"}`,
    `  document.title: ${titleSources.documentTitle ?? "(none)"}`,
    `  URL segment: ${titleSources.lastUrlSegment ?? "(none)"}`,
    `  Stored page.title: ${titleSources.storedPageTitle}`,
    "",
    "Rules executed:",
    String(report.rulesExecuted),
    "",
    "Findings:",
    String(report.findingCount),
  ]

  if (report.analysisFailed) {
    lines.push("", "ANALYSIS FAILED:", report.failureReason ?? "unknown")
  }

  lines.push("", "========================================", "")

  console.log(lines.join("\n"))
}

export function printDuplicateSnapshotWarnings(snapshots: PageContentSnapshot[]): void {
  const entries = snapshots
    .filter((snapshot) => snapshot.html)
    .map((snapshot) => {
      const metrics = extractDomMetrics(snapshot.html, snapshot.document)
      return {
        path: normalizeAuditPath(snapshot.page.path),
        hash: snapshot.contentHash,
        domLength: metrics.domLength,
        visibleTextLength: metrics.visibleTextLength,
        preview: metrics.domPreview500,
      }
    })

  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const a = entries[i]
      const b = entries[j]

      const identicalHash = Boolean(a.hash && b.hash && a.hash === b.hash)
      const identicalDom =
        a.domLength === b.domLength &&
        a.visibleTextLength === b.visibleTextLength &&
        a.preview === b.preview

      if (!identicalHash && !identicalDom) continue

      const reason = identicalHash ? "Identical content hash" : "Identical DOM"

      console.warn(
        [
          "WARNING:",
          "Duplicate snapshot detected",
          "",
          "Page A:",
          a.path,
          "",
          "Page B:",
          b.path,
          "",
          "Reason:",
          reason,
          "",
          `DOM length: ${a.domLength}`,
          `Visible text: ${a.visibleTextLength}`,
          `Preview (first 500 chars): ${a.preview.slice(0, 120)}...`,
          "",
        ].join("\n")
      )
    }
  }
}

export function buildMetricsFromRenderDiagnostics(
  diagnostics: RenderPageDiagnostics,
  html: string
): PageDomMetrics {
  return {
    domLength: diagnostics.domLength || html.length,
    visibleTextLength: diagnostics.visibleTextLength,
    headingCount: diagnostics.headingCount,
    formCount: diagnostics.formCount,
    buttonCount: diagnostics.buttonCount,
    linkCount: diagnostics.linkCount,
    firstH1: diagnostics.firstH1,
    domPreview500: html.slice(0, 500),
  }
}

export function metricsForSnapshot(snapshot: PageContentSnapshot): PageDomMetrics {
  if (snapshot.renderDiagnostics && snapshot.html) {
    return buildMetricsFromRenderDiagnostics(snapshot.renderDiagnostics, snapshot.html)
  }

  return extractDomMetrics(snapshot.html, snapshot.document)
}
