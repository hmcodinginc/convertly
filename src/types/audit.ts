export type AuditStatus = "Completed" | "Running" | "Scheduled"

/** List / table representation of an audit */
export type Audit = {
  id: string
  name: string
  domain: string
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
  page?: string
}

export type RecommendationPriority = "Critical" | "High" | "Medium"

export type Recommendation = {
  id: string
  title: string
  summary: string
  priority: RecommendationPriority
  estimatedLift: string
  category: string
}

export type PageFindingStatus = "Healthy" | "At risk" | "Critical"

export type PageFinding = {
  id: string
  label: string
  path: string
  score: number
  issuesCount: number
  status: PageFindingStatus
}

export type ScoreBreakdownItem = {
  id: string
  label: "Clarity" | "Trust" | "Friction" | "Performance" | "CTA Strength"
  score: number
  trend: "up" | "down" | "neutral"
  trendValue: string
  status: "Strong" | "Needs work" | "Critical"
}

export type TimelineEvent = {
  id: string
  label: string
  timestamp: string
  status: "completed" | "in_progress" | "pending"
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
  completedAt: string
  pagesAnalyzed: number
  overallScore: number
  previousScore: number
  scoreDelta: number
  status: AuditStatus
  issues: Issue[]
  recommendations: Recommendation[]
  scoreBreakdown: ScoreBreakdownItem[]
  pageFindings: PageFinding[]
  timeline: TimelineEvent[]
}

export type CreateAuditInput = {
  url: string
}
