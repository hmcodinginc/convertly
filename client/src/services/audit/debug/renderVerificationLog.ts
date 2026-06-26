import type { PageContentSnapshot } from "@/services/audit/pageContentService"
import { verifyPageAnalysisGate } from "@/services/audit/debug/pageSnapshotDiagnostics"

export function logPageRenderVerification(snapshot: PageContentSnapshot): void {
  const gate = verifyPageAnalysisGate(snapshot)
  const diagnostics = snapshot.renderDiagnostics
  const requestedPath = snapshot.page.path
  const browserUrl = snapshot.finalUrl ?? snapshot.page.url

  let browserPathname: string
  try {
    browserPathname = diagnostics?.pathname ?? new URL(browserUrl).pathname
  } catch {
    browserPathname = diagnostics?.pathname ?? "(invalid final URL)"
  }
  const title =
    diagnostics?.documentTitle ??
    snapshot.document?.querySelector("title")?.textContent?.trim() ??
    "(none)"
  const h1 =
    diagnostics?.firstH1 ??
    snapshot.document?.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim() ??
    "(none)"
  const domLength = diagnostics?.domLength ?? snapshot.html?.length ?? 0
  const contentSource = snapshot.contentSource ?? "unknown"
  const hydration = gate.hydrationPassed ? "PASS" : "FAIL"

  const lines = [
    "========================================",
    "",
    "Requested:",
    requestedPath,
    "",
    "Browser:",
    browserUrl,
    "",
    "Pathname:",
    browserPathname,
    "",
    "Title:",
    title,
    "",
    "H1:",
    h1,
    "",
    "DOM:",
    `${domLength} chars`,
    "",
    "Content:",
    contentSource,
    "",
    "Hydration:",
    hydration,
    "",
    "========================================",
    "",
  ]

  if (browserPathname === "/" && requestedPath !== "/") {
    console.warn(
      `[audit-pipeline] Browser landed on "/" but requested ${requestedPath}`
    )
  }

  console.log(lines.join("\n"))
}
