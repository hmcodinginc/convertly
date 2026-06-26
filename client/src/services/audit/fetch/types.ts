import type { ExtractedLink } from "@/services/audit/linkExtractor"

export type ContentSource = "static" | "rendered"

export type HtmlQualityAssessment = {
  shouldRender: boolean
  confidence: number
  reasons: string[]
}

export type RenderPageDiagnostics = {
  pathname: string
  readyState: string
  domSettleMs: number
  hydrationSettled: boolean
  domLength: number
  visibleTextLength: number
  headingCount: number
  formCount: number
  buttonCount: number
  linkCount: number
  firstH1: string | null
  documentTitle: string
  openGraphTitle: string | null
}

export type AcquiredPageContent = {
  ok: boolean
  status: number
  finalUrl: string
  html: string | null
  contentHash: string | null
  contentSource: ContentSource
  renderDiagnostics?: RenderPageDiagnostics | null
  error?: string
}

export type RenderPageResult = {
  ok: boolean
  finalUrl: string
  html: string | null
  text: string | null
  title: string | null
  links: ExtractedLink[]
  headings: { h1: string[]; h2: string[] }
  contentHash: string | null
  rendered: true
  diagnostics?: RenderPageDiagnostics | null
  error?: string
}

export type AuditFetchContext = {
  cache: Map<string, AcquiredPageContent>
  renderedPageCount: number
  spaMode: boolean
  homepageContentHash: string | null
}

export function createAuditFetchContext(): AuditFetchContext {
  return {
    cache: new Map(),
    renderedPageCount: 0,
    spaMode: false,
    homepageContentHash: null,
  }
}
