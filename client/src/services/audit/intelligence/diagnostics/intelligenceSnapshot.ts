import type { AuditDiagnosticsBundle } from "@/services/audit/intelligence/diagnostics/auditDiagnostics"
import type { CrawlDiagnostics } from "@/services/audit/intelligence/diagnostics/crawlDiagnostics"
import type { GroupedIntelligenceFinding } from "@/services/audit/intelligence/findings/groupedFindings"
import type { AuditStrength } from "@/services/audit/intelligence/reporting/auditStrengths"
import type { ReportScoreExplanation } from "@/services/audit/intelligence/reporting/reportScoreExplanation"
import type { DetectedWebsiteIntent } from "@/services/audit/intelligence/websiteIntentTypes"
import type { SiteRenderConfidence } from "@/services/audit/intelligence/rendering/renderConfidence"
import type { ReliabilityReport } from "@/services/audit/intelligence/rendering/renderReliability"
import type { EngineDiagnostics } from "@/services/audit/intelligence/diagnostics/engineDiagnostics"

export const INTELLIGENCE_SNAPSHOT_PREFIX = "__INTELLIGENCE_SNAPSHOT_V1__:"

/** Stable per-audit record for future website timeline comparisons */
export type AuditComparisonRecord = {
  auditId: string
  websiteUrl: string
  domain: string
  auditedAt: string
  growthScore: number
  growthPotential: number
  scoreCeiling: number
  findingsCount: number
  pagesAnalyzed: number
  auditEngineVersion: string
}

/** Optional Open Graph / favicon URLs captured from already-parsed page documents */
export type PagePreviewMeta = {
  openGraphImage: string | null
  faviconUrl: string | null
}

export type IntelligenceSnapshot = {
  version: 1
  pageScores: Record<string, number>
  pageIntents: Record<string, string>
  auditConfidence: number
  growthPotential: number
  scoreCeiling: number
  consultantRecommendations?: import("@/services/audit/intelligence/recommendations/consultantRecommendation").ConsultantRecommendation[]
  comparisonRecord?: AuditComparisonRecord
  diagnostics?: AuditDiagnosticsBundle
  websiteIntent?: DetectedWebsiteIntent
  strengths?: AuditStrength[]
  groupedFindings?: GroupedIntelligenceFinding[]
  reportScoreExplanation?: ReportScoreExplanation
  crawlDiagnostics?: CrawlDiagnostics
  renderConfidence?: SiteRenderConfidence
  reliabilityReport?: ReliabilityReport
  auditConfidenceTier?: "High" | "Medium" | "Low"
  manualVerificationRecommended?: boolean
  /** Report-only page previews from OG/favicon meta — optional, ignored by scoring */
  pagePreviews?: Record<string, PagePreviewMeta>
  /** V5 internal engine diagnostics — debugging only */
  engineDiagnostics?: EngineDiagnostics
}

export function serializeIntelligenceSnapshot(snapshot: IntelligenceSnapshot): string {
  return `${INTELLIGENCE_SNAPSHOT_PREFIX}${JSON.stringify(snapshot)}`
}

export function parseIntelligenceSnapshotFromHistory(
  messages: string[]
): IntelligenceSnapshot | null {
  const row = messages.find((message) => message.startsWith(INTELLIGENCE_SNAPSHOT_PREFIX))
  if (!row) return null

  try {
    const json = row.slice(INTELLIGENCE_SNAPSHOT_PREFIX.length)
    return JSON.parse(json) as IntelligenceSnapshot
  } catch {
    return null
  }
}

export function getPageScoreFromSnapshot(
  snapshot: IntelligenceSnapshot | null,
  pageId: string,
  fallback: number
): number {
  const score = snapshot?.pageScores[pageId]
  if (score == null) return fallback
  return score
}
