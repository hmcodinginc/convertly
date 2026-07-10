import { RULE_METADATA } from "@/services/audit/intelligence/rules/ruleMetadata"
import {
  ANALYSIS_STAGE_IDS,
  AUDIT_EXECUTION_STAGES,
  POST_ANALYSIS_STAGE_IDS,
  stageIndex,
  stageLabel,
} from "@/services/audit/execution/auditExecutionStages"
import { pickExecutionInsight } from "@/services/audit/execution/executionInsights"
import { parseDomainFromUrl } from "@/lib/auditUrlValidation"
import { isAuditInProgress } from "@/lib/auditStatus"
import type {
  AuditExecutionMetrics,
  AuditExecutionStage,
  AuditExecutionStageId,
  AuditExecutionState,
} from "@/types/auditExecution"
import type { AuditSessionData } from "@/types/auditEngine"

function normalizeAnalyzedPath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed || trimmed === "/") return "/"
  return trimmed.replace(/\/+$/, "") || "/"
}

function getAnalyzedPathsFromHistory(history: AuditSessionData["history"]): Set<string> {
  const paths = new Set<string>()
  for (const event of history) {
    const match = event.message.match(/^Analyzed (\S+) —/)
    if (match?.[1]) {
      paths.add(normalizeAnalyzedPath(match[1]))
    }
  }
  return paths
}

function countScreenshotsCaptured(pages: AuditSessionData["pages"]): number {
  return pages.reduce((count, page) => {
    const desktop = page.screenshots.desktop.captureStatus === "captured" ? 1 : 0
    const mobile = page.screenshots.mobile.captureStatus === "captured" ? 1 : 0
    return count + desktop + mobile
  }, 0)
}

function countFindingsBySeverity(
  findings: AuditSessionData["findings"],
  severity: "critical" | "high" | "medium"
): number {
  return findings.filter((finding) => finding.severity === severity).length
}

function hasDiscoveryComplete(history: AuditSessionData["history"]): boolean {
  return history.some((event) => event.message.startsWith("Discovered "))
}

function hasIntelligenceSnapshot(history: AuditSessionData["history"]): boolean {
  return history.some((event) => event.message.startsWith("__INTELLIGENCE_SNAPSHOT_V1__:"))
}

function resolveActiveStageId(data: AuditSessionData): AuditExecutionStageId {
  const { session, pages, history } = data
  const analyzedCount = getAnalyzedPathsFromHistory(history).size
  const pagesDiscovered = pages.length
  const discoveryDone = hasDiscoveryComplete(history)
  const snapshotReady = hasIntelligenceSnapshot(history)

  if (session.status === "pending") {
    return history.length > 0 ? "validating-website" : "preparing-workspace"
  }

  if (session.status === "crawling") {
    if (pagesDiscovered === 0) return "discovering-pages"
    return "capturing-screenshots"
  }

  if (session.status === "analyzing") {
    if (!discoveryDone && pagesDiscovered === 0) return "discovering-pages"
    if (pagesDiscovered > 0 && analyzedCount === 0) return "rendering-dom"

    if (analyzedCount > 0 && analyzedCount < pagesDiscovered) {
      const ratio = analyzedCount / Math.max(pagesDiscovered, 1)
      const analysisIndex = Math.min(
        ANALYSIS_STAGE_IDS.length - 1,
        Math.floor(ratio * ANALYSIS_STAGE_IDS.length)
      )
      return ANALYSIS_STAGE_IDS[analysisIndex] ?? "rendering-dom"
    }

    if (analyzedCount >= pagesDiscovered && pagesDiscovered > 0) {
      if (snapshotReady) return "finalizing-report"
      const postIndex = Math.min(
        POST_ANALYSIS_STAGE_IDS.length - 1,
        Math.floor((analyzedCount / pagesDiscovered) * 2)
      )
      return POST_ANALYSIS_STAGE_IDS[postIndex] ?? "calculating-scores"
    }

    return "rendering-dom"
  }

  if (session.status === "completed") return "finalizing-report"
  return "preparing-workspace"
}

function buildMetrics(data: AuditSessionData): AuditExecutionMetrics {
  const analyzedCount = getAnalyzedPathsFromHistory(data.history).size
  const pagesDiscovered = data.pages.length
  const findings = data.findings
  const rulesTotal = RULE_METADATA.length

  const rulesEvaluated =
    data.session.status === "completed"
      ? rulesTotal
      : analyzedCount > 0
        ? Math.min(rulesTotal, Math.round((analyzedCount / Math.max(pagesDiscovered, 1)) * rulesTotal))
        : 0

  return {
    pagesDiscovered,
    pagesAnalyzed: analyzedCount,
    rulesEvaluated,
    findingsDetected: findings.length,
    criticalIssues: countFindingsBySeverity(findings, "critical"),
    highIssues: countFindingsBySeverity(findings, "high"),
    mediumIssues: countFindingsBySeverity(findings, "medium"),
    screenshotsCaptured: countScreenshotsCaptured(data.pages),
  }
}

function buildStages(activeStageId: AuditExecutionStageId, failed: boolean): AuditExecutionStage[] {
  const activeIndex = stageIndex(activeStageId)

  return AUDIT_EXECUTION_STAGES.map((stage, index) => {
    let status: AuditExecutionStage["status"] = "waiting"

    if (index < activeIndex) {
      status = "completed"
    } else if (index === activeIndex) {
      status = failed ? "failed" : "active"
    }

    return {
      id: stage.id,
      label: stage.label,
      status,
    }
  })
}

function computePercentage(activeStageId: AuditExecutionStageId, data: AuditSessionData): number {
  const activeIndex = stageIndex(activeStageId)
  const total = AUDIT_EXECUTION_STAGES.length

  if (data.session.status === "completed") return 100

  const analyzedCount = getAnalyzedPathsFromHistory(data.history).size
  const pagesDiscovered = Math.max(data.pages.length, 1)

  let subProgress = 0
  if (ANALYSIS_STAGE_IDS.includes(activeStageId) && analyzedCount > 0) {
    subProgress = (analyzedCount / pagesDiscovered) * 0.6
  } else if (activeStageId === "capturing-screenshots" && data.pages.length > 0) {
    subProgress = Math.min(0.8, data.pages.length / 8)
  } else if (POST_ANALYSIS_STAGE_IDS.includes(activeStageId)) {
    subProgress = hasIntelligenceSnapshot(data.history) ? 0.85 : 0.35
  } else {
    subProgress = 0.45
  }

  const raw = ((activeIndex + subProgress) / total) * 100
  return Math.min(99, Math.round(raw))
}

function estimateEtaSeconds(
  percentage: number,
  startedAt: string,
  status: AuditSessionData["session"]["status"]
): number | null {
  if (status === "completed" || status === "failed") return 0
  if (percentage <= 2) return null

  const elapsedMs = Date.now() - new Date(startedAt).getTime()
  if (elapsedMs < 1500) return null

  const remainingRatio = (100 - percentage) / Math.max(percentage, 1)
  return Math.max(3, Math.round((elapsedMs / 1000) * remainingRatio))
}

function resolveCurrentTask(stageId: AuditExecutionStageId, metrics: AuditExecutionMetrics): string {
  if (stageId === "discovering-pages" && metrics.pagesDiscovered > 0) {
    return `Found ${metrics.pagesDiscovered} page${metrics.pagesDiscovered === 1 ? "" : "s"}`
  }
  if (ANALYSIS_STAGE_IDS.includes(stageId) && metrics.pagesAnalyzed > 0) {
    return `Analyzed ${metrics.pagesAnalyzed} of ${Math.max(metrics.pagesDiscovered, metrics.pagesAnalyzed)} pages`
  }
  return stageLabel(stageId)
}

export function deriveAuditExecutionState(
  data: AuditSessionData,
  options?: { insightTick?: number; completing?: boolean }
): AuditExecutionState {
  const { session } = data
  const domain = parseDomainFromUrl(session.websiteUrl)
  const failed = session.status === "failed"
  const activeStageId = failed ? resolveActiveStageId(data) : resolveActiveStageId(data)
  const metrics = buildMetrics(data)
  const percentage = computePercentage(activeStageId, data)
  const stages = buildStages(activeStageId, failed)
  const completedStageIds = stages
    .filter((stage) => stage.status === "completed")
    .map((stage) => stage.id)

  let status: AuditExecutionState["status"] = session.status
  if (options?.completing) {
    status = "completing"
  } else if (session.status === "completed" && !options?.completing) {
    status = "completed"
  }

  return {
    auditId: session.id,
    domain,
    websiteUrl: session.websiteUrl,
    status,
    currentStageId: activeStageId,
    currentTask: resolveCurrentTask(activeStageId, metrics),
    stages,
    completedStageIds,
    percentage: session.status === "completed" ? 100 : percentage,
    etaSeconds: estimateEtaSeconds(percentage, session.createdAt, session.status),
    metrics,
    insight: pickExecutionInsight(activeStageId, domain, options?.insightTick ?? 0),
    errorMessage: session.errorMessage,
    startedAt: session.createdAt,
  }
}

export function isExecutionTerminal(state: AuditExecutionState): boolean {
  return state.status === "completed" || state.status === "failed" || state.status === "completing"
}

export function isExecutionRunning(data: AuditSessionData): boolean {
  return isAuditInProgress(data.session.status)
}

export { getAnalyzedPathsFromHistory }
