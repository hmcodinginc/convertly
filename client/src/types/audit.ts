import type { AuditSessionStatus } from "@/types/auditEngine"

/** Legacy sample-data statuses preserved for existing mock audits */
export type LegacyAuditStatus = "Completed" | "Running" | "Scheduled"

export type AuditStatus = AuditSessionStatus | LegacyAuditStatus

/** List / table representation of an audit */
export type Audit = {
  id: string
  name: string
  domain: string
  websiteUrl?: string
  completedAt: string
  pagesScanned: number
  conversionScore: number
  status: AuditStatus
}

/** Alias for list views — same shape as Audit */
export type AuditSummary = Audit

export type IssueSeverity = "Critical" | "High" | "Medium" | "Low"

export type Issue = {
  id: string
  issue: string
  severity: IssueSeverity
  impact: string
  recommendation?: string
  category?: string
  page?: string
}

/** Site-wide finding with no page association */
export type SiteFinding = Omit<Issue, "page">

export type RecommendationPriority = "Critical" | "High" | "Medium"

export type Recommendation = {
  id: string
  title: string
  summary: string
  priority: RecommendationPriority
  estimatedLift: string
  category: string
  affectedPages?: string[]
  affectedCount?: number
}

export type PageFindingStatus = "Healthy" | "At risk" | "Critical"

export type PageSeverityBreakdown = {
  critical: number
  high: number
  medium: number
  low: number
}

export type PageCategoryCount = {
  category: string
  count: number
}

export type PageFinding = {
  id: string
  label: string
  path: string
  url?: string
  pageType?: string
  discoveryStatus?: string
  score: number
  issuesCount: number
  status: PageFindingStatus
  severityBreakdown?: PageSeverityBreakdown
  categoryBreakdown?: PageCategoryCount[]
}

export type ScoreImpactItem = {
  title: string
  count: number
  severity: IssueSeverity
}

export type ScoreBreakdownItem = {
  id: string
  label:
    | "Growth"
    | "Conversion"
    | "Trust"
    | "Mobile"
    | "UX"
    | "Clarity"
    | "Friction"
    | "Performance"
    | "CTA Strength"
  score: number
  trend: "up" | "down" | "neutral"
  trendValue: string
  status: "Strong" | "Needs work" | "Critical"
  topImpacts?: ScoreImpactItem[]
}

export type TimelineEvent = {
  id: string
  label: string
  timestamp: string
  status: "completed" | "in_progress" | "pending"
  kind?: "discovery" | "page-analysis" | "completion" | "phase" | "error"
  detail?: string
}

export type AuditRunStats = {
  totalFindings: number
  pageFindingsCount: number
  siteFindingsCount: number
  totalRecommendations: number
}

export type AuditRunMetadata = {
  pagesDiscovered: number
  pagesReachable: number
  pagesUnreachable: number
  pagesAnalyzed: number
  findingsCount: number
  siteFindingsCount: number
  pageFindingsCount: number
  ruleCount: number
  auditEngineVersion: string
  /** V3 — composite confidence in audit completeness (0–100) */
  auditConfidence?: number
  auditConfidenceLabel?: string
  /** V3 — estimated score after resolving detected issues */
  growthPotential?: number
  recoverablePoints?: number
  /** V3 — maximum achievable Growth Score while blockers are active */
  scoreCeiling?: number
  blockerCount?: number
}

export type RecommendationPlaybook = {
  recommendationId: string
  problem: string
  whyItMatters: string
  recommendation: string
  estimatedLift: string
  implementationSteps: string[]
}

export type AuditDetail = {
  id: string
  name: string
  domain: string
  websiteUrl?: string
  createdAt?: string
  completedAtDate?: string
  completedAt: string
  pagesAnalyzed: number
  overallScore: number
  previousScore: number
  scoreDelta: number
  status: AuditStatus
  errorMessage?: string
  issues: Issue[]
  siteFindings: SiteFinding[]
  recommendations: Recommendation[]
  scoreBreakdown: ScoreBreakdownItem[]
  pageFindings: PageFinding[]
  timeline: TimelineEvent[]
  stats: AuditRunStats
  runMetadata: AuditRunMetadata
}

export type CreateAuditInput = {
  url: string
}
