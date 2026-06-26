/** Core audit session lifecycle statuses */
export type AuditSessionStatus =
  | "pending"
  | "crawling"
  | "analyzing"
  | "completed"
  | "failed"

export type AuditSession = {
  id: string
  userId: string
  websiteUrl: string
  createdAt: string
  updatedAt: string
  status: AuditSessionStatus
  errorMessage?: string
}

export type AuditPageType =
  | "homepage"
  | "pricing"
  | "about"
  | "contact"
  | "services"
  | "features"
  | "login"
  | "signup"
  | "custom"

export type PageDiscoveryStatus = "candidate" | "reachable" | "unreachable" | "unknown"

export type ScreenshotViewport = "desktop" | "mobile"

export type ScreenshotCaptureStatus = "pending" | "placeholder" | "captured"

export type ScreenshotReference = {
  viewport: ScreenshotViewport
  storageKey: string
  captureStatus: ScreenshotCaptureStatus
  width: number
  height: number
  placeholderLabel: string
  capturedAt?: string
}

export type AuditPage = {
  id: string
  auditId: string
  pageType: AuditPageType
  url: string
  path: string
  title: string
  discoveryStatus: PageDiscoveryStatus
  discoveredAt: string
  screenshots: {
    desktop: ScreenshotReference
    mobile: ScreenshotReference
  }
}

export type FindingCategory =
  | "ux"
  | "conversion"
  | "trust"
  | "performance"
  | "copy"
  | "accessibility"
  | "technical"

export type FindingSeverity = "critical" | "high" | "medium" | "low"

/** Structured finding returned by future audit rules */
export type AuditFinding = {
  id: string
  auditId: string
  pageId?: string
  category: FindingCategory
  severity: FindingSeverity
  title: string
  description: string
  recommendation: string
  createdAt: string
}

/** Input shape for audit rules — rules engine will return these */
export type AuditFindingInput = Omit<AuditFinding, "id" | "auditId" | "createdAt">

export type AuditScoreCategory =
  | "conversion"
  | "trust"
  | "mobile"
  | "ux"
  | "growth"
  | "clarity"
  | "friction"
  | "performance"
  | "cta_strength"
  | "overall"

export type AuditScore = {
  id: string
  auditId: string
  category: AuditScoreCategory
  score: number | null
  maxScore: number
  label: string
  createdAt: string
  updatedAt: string
}

export type AuditHistoryEvent = {
  id: string
  auditId: string
  status: AuditSessionStatus
  message: string
  createdAt: string
}

/** Full audit session payload for detail views and rule execution */
export type AuditSessionData = {
  session: AuditSession
  pages: AuditPage[]
  findings: AuditFinding[]
  scores: AuditScore[]
  history: AuditHistoryEvent[]
}

import type { AuditPage, AuditSession } from "@/types/auditEngine"
import type { PageContentSnapshot } from "@/services/audit/pageContentService"

/** Contract for future audit rules */
export type AuditRuleContext = {
  session: AuditSession
  pages: AuditPage[]
  pageSnapshots: PageContentSnapshot[]
  /** Set by Intelligence Engine V2 during per-page execution */
  currentPageSnapshot?: PageContentSnapshot
}

export type AuditRuleResult = {
  findings: AuditFindingInput[]
  scores?: Partial<Record<AuditScoreCategory, number>>
}

export type AuditRule = {
  id: string
  name: string
  category: FindingCategory
  run: (context: AuditRuleContext) => Promise<AuditRuleResult>
}

export type DiscoveredPageCandidate = {
  pageType: AuditPageType
  path: string
  url: string
  discoveryStatus: PageDiscoveryStatus
  title?: string
}

export type AuditUrlValidationResult = {
  valid: boolean
  sanitizedUrl: string
  domain: string
  errors: string[]
  warnings: string[]
}
