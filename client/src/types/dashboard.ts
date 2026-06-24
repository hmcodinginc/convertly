export type DashboardMetric = {
  id: string
  label: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  hint: string
}

export type OpportunityItem = {
  id: string
  page: string
  issue: string
  impact: "High" | "Medium" | "Low"
  score: number
  status: "Open" | "In review" | "Queued"
}

export type DashboardSnapshot = {
  metrics: DashboardMetric[]
  opportunities: OpportunityItem[]
  showOnboarding: boolean
}
