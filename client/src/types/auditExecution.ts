import type { AuditSessionStatus } from "@/types/auditEngine"

export type AuditExecutionStageStatus = "waiting" | "active" | "completed" | "failed"

export type AuditExecutionStageId =
  | "preparing-workspace"
  | "validating-website"
  | "discovering-pages"
  | "capturing-screenshots"
  | "rendering-dom"
  | "detecting-navigation"
  | "detecting-ctas"
  | "detecting-forms"
  | "detecting-hero"
  | "checking-trust"
  | "checking-accessibility"
  | "running-seo"
  | "running-mobile"
  | "calculating-scores"
  | "prioritizing-issues"
  | "building-recommendations"
  | "building-playbooks"
  | "finalizing-report"

export type AuditExecutionStage = {
  id: AuditExecutionStageId
  label: string
  status: AuditExecutionStageStatus
}

export type AuditExecutionMetrics = {
  pagesDiscovered: number
  pagesAnalyzed: number
  rulesEvaluated: number
  findingsDetected: number
  criticalIssues: number
  highIssues: number
  mediumIssues: number
  screenshotsCaptured: number
}

export type AuditExecutionStatus = AuditSessionStatus | "completing"

export type AuditExecutionState = {
  auditId: string
  domain: string
  websiteUrl: string
  status: AuditExecutionStatus
  currentStageId: AuditExecutionStageId
  currentTask: string
  stages: AuditExecutionStage[]
  completedStageIds: AuditExecutionStageId[]
  percentage: number
  etaSeconds: number | null
  metrics: AuditExecutionMetrics
  insight: string
  errorMessage?: string
  startedAt: string
  /** Populated when status transitions to completed */
  resultScore?: number
  resultIssueCount?: number
  resultTopOpportunity?: string
}

/** Future SSE / websocket payloads can extend this shape */
export type AuditExecutionStreamEvent = {
  type: "stage" | "metrics" | "progress" | "complete" | "error"
  payload: Partial<AuditExecutionState>
}
