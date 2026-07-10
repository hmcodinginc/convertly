import type { FetchFailureKind } from "@/services/audit/fetch/fetchErrorClassifier"

export type CrawlStage =
  | "dns"
  | "robots"
  | "static_fetch"
  | "page_acquisition"
  | "playwright_launch"
  | "playwright_navigation"
  | "playwright_render"
  | "js_execution"
  | "redirect"
  | "cloudflare"
  | "bot_protection"
  | "completed"
  | "unknown"

export type CrawlStopReason =
  | "completed"
  | "max_pages_reached"
  | "homepage_unreachable"
  | "cloudflare_blocked"
  | "bot_protection"
  | "robots_blocked"
  | "authentication_required"
  | "rate_limited"
  | "timeout"
  | "dns_failure"
  | "ssl_failure"
  | "connection_refused"
  | "javascript_render_failed"
  | "response_too_large"
  | "redirect_loop"
  | "unknown"

export type PageAcquisitionDiagnostics = {
  url: string
  crawlStage: CrawlStage
  crawlError?: string
  httpStatus?: number
  redirectCount: number
  renderTimeMs?: number
  browserError?: string
  playwrightError?: string
  retryAttempts: number
  blockedByCloudflare: boolean
  blockedByBotProtection: boolean
  timedOut: boolean
  javascriptExecuted: boolean
  pageAcquired: boolean
  renderCompleted: boolean
  contentSource?: "static" | "rendered"
  navigationStrategy?: string
}

export type CrawlDiagnostics = {
  pagesDiscovered: number
  pagesVerified: number
  pagesRejected: number
  pagesSkippedDuplicate: number
  pagesBlocked: number
  redirectCount: number
  duplicatesRemoved: number
  pagesAnalyzed: number
  pagesSkippedAnalysis: number
  crawlStoppedReason: CrawlStopReason
  crawlStoppedDetail?: string
  failureKind?: FetchFailureKind
  crawlStage?: CrawlStage
  crawlError?: string
  httpStatus?: number
  renderTimeMs?: number
  browserError?: string
  playwrightError?: string
  retryAttempts?: number
  blockedByCloudflare?: boolean
  blockedByBotProtection?: boolean
  timedOut?: boolean
  javascriptExecuted?: boolean
  pageAcquired?: boolean
  renderCompleted?: boolean
  pageTraces?: PageAcquisitionDiagnostics[]
}

export function createEmptyCrawlDiagnostics(): CrawlDiagnostics {
  return {
    pagesDiscovered: 0,
    pagesVerified: 0,
    pagesRejected: 0,
    pagesSkippedDuplicate: 0,
    pagesBlocked: 0,
    redirectCount: 0,
    duplicatesRemoved: 0,
    pagesAnalyzed: 0,
    pagesSkippedAnalysis: 0,
    crawlStoppedReason: "completed",
    pageTraces: [],
  }
}

export function mergeAcquisitionIntoCrawlDiagnostics(
  diagnostics: CrawlDiagnostics,
  trace: PageAcquisitionDiagnostics
): void {
  diagnostics.pageTraces = [...(diagnostics.pageTraces ?? []), trace]
  diagnostics.crawlStage = trace.crawlStage
  diagnostics.crawlError = trace.crawlError
  diagnostics.httpStatus = trace.httpStatus
  diagnostics.renderTimeMs = trace.renderTimeMs
  diagnostics.browserError = trace.browserError
  diagnostics.playwrightError = trace.playwrightError
  diagnostics.retryAttempts = trace.retryAttempts
  diagnostics.blockedByCloudflare = trace.blockedByCloudflare
  diagnostics.blockedByBotProtection = trace.blockedByBotProtection
  diagnostics.timedOut = trace.timedOut
  diagnostics.javascriptExecuted = trace.javascriptExecuted
  diagnostics.pageAcquired = trace.pageAcquired
  diagnostics.renderCompleted = trace.renderCompleted
}

export function crawlStopReasonFromFailureKind(kind: FetchFailureKind): CrawlStopReason {
  switch (kind) {
    case "cloudflare":
      return "cloudflare_blocked"
    case "bot_protection":
      return "bot_protection"
    case "blocked":
    case "robots_blocked":
      return "robots_blocked"
    case "authentication_required":
      return "authentication_required"
    case "rate_limited":
      return "rate_limited"
    case "timeout":
      return "timeout"
    case "dns":
      return "dns_failure"
    case "ssl":
      return "ssl_failure"
    case "connection_refused":
      return "connection_refused"
    case "javascript_render_failed":
      return "javascript_render_failed"
    case "response_too_large":
      return "response_too_large"
    case "redirect_loop":
      return "redirect_loop"
    case "network":
      return "connection_refused"
    case "unreachable":
      return "homepage_unreachable"
    default:
      return "unknown"
  }
}

export function crawlStageFromFailureKind(kind: FetchFailureKind): CrawlStage {
  switch (kind) {
    case "dns":
      return "dns"
    case "cloudflare":
      return "cloudflare"
    case "bot_protection":
      return "bot_protection"
    case "timeout":
      return "playwright_navigation"
    case "javascript_render_failed":
      return "playwright_render"
    case "ssl":
    case "connection_refused":
    case "network":
    case "unreachable":
      return "static_fetch"
    default:
      return "page_acquisition"
  }
}

export function describeCrawlStopReason(diagnostics: CrawlDiagnostics): string {
  if (diagnostics.crawlStoppedDetail) {
    return diagnostics.crawlStoppedDetail
  }

  const stage = diagnostics.crawlStage ? ` (${diagnostics.crawlStage})` : ""

  switch (diagnostics.crawlStoppedReason) {
    case "completed":
      return "Crawl completed successfully."
    case "max_pages_reached":
      return `Crawl stopped after reaching the maximum page limit (${diagnostics.pagesVerified} pages verified).`
    case "cloudflare_blocked":
      return `Crawl stopped — Cloudflare challenge blocked automated access${stage}.`
    case "bot_protection":
      return `Crawl stopped — bot protection blocked automated access${stage}.`
    case "robots_blocked":
      return "Crawl stopped — URL blocked by security policy."
    case "authentication_required":
      return "Crawl stopped — authentication is required to access this site."
    case "rate_limited":
      return "Crawl stopped — the website rate-limited our requests."
    case "timeout":
      return `Crawl stopped — timed out during ${diagnostics.crawlStage ?? "fetch"}${diagnostics.renderTimeMs ? ` after ${diagnostics.renderTimeMs}ms` : ""}.`
    case "dns_failure":
      return "Crawl stopped — the domain could not be resolved (DNS failure)."
    case "ssl_failure":
      return "Crawl stopped — a secure connection could not be established (SSL/TLS failure)."
    case "connection_refused":
      return "Crawl stopped — the server refused the connection."
    case "javascript_render_failed":
      return `Crawl stopped — JavaScript rendering failed${diagnostics.playwrightError ? `: ${diagnostics.playwrightError}` : ""}.`
    case "response_too_large":
      return "Crawl stopped — the homepage HTML response exceeded the static fetch size limit."
    case "redirect_loop":
      return "Crawl stopped — the website redirected too many times (possible redirect loop)."
    case "homepage_unreachable":
      return `Crawl stopped — the homepage could not be reached${diagnostics.crawlError ? `: ${diagnostics.crawlError}` : ""}.`
    default:
      return diagnostics.crawlError ?? "Crawl stopped for an unknown reason."
  }
}
