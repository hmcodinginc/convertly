import type { PageContentSnapshot } from "@/services/audit/pageContentService"

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
