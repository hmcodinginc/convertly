import type { ExtractedLink } from "@/services/audit/linkExtractor"

export type ContentSource = "static" | "rendered"

export type HtmlQualityAssessment = {
  shouldRender: boolean
  confidence: number
  reasons: string[]
}

export type AcquiredPageContent = {
  ok: boolean
  status: number
  finalUrl: string
  html: string | null
  contentHash: string | null
  contentSource: ContentSource
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
