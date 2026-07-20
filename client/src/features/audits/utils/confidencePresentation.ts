import type { AuditRunMetadata } from "@/types/audit"

export type AuditConfidenceTier = "High" | "Medium" | "Low"

/** Engine tier thresholds — must match auditConfidenceEngine.ts */
export function tierFromEngineScore(score: number): AuditConfidenceTier {
  if (score >= 80) return "High"
  if (score >= 60) return "Medium"
  return "Low"
}

export function formatEngineConfidenceLabel(tier: AuditConfidenceTier): string {
  return `${tier} confidence`
}

export function getConfidenceTier(meta: AuditRunMetadata): AuditConfidenceTier | undefined {
  if (meta.auditConfidenceTier) return meta.auditConfidenceTier
  if (meta.auditConfidence != null) return tierFromEngineScore(meta.auditConfidence)
  return undefined
}

export function getConfidenceDisplayLabel(meta: AuditRunMetadata): string | undefined {
  const tier = getConfidenceTier(meta)
  if (tier) return formatEngineConfidenceLabel(tier)
  return meta.auditConfidenceLabel
}

export type ConfidenceExplanationLine = {
  kind: "success" | "warning" | "info"
  text: string
}

function formatRenderLevel(level: string): string {
  return level.replace(/_/g, " ")
}

function humanizeSignal(signal: string): string {
  return signal.replace(/-/g, " ")
}

export function buildConfidenceExplanationLines(
  meta: AuditRunMetadata
): ConfidenceExplanationLine[] {
  const lines: ConfidenceExplanationLine[] = []
  const crawl = meta.crawlDiagnostics
  const render = meta.renderConfidence
  const reliability = meta.reliabilityReport

  const pagesDiscovered = crawl?.pagesDiscovered ?? meta.pagesDiscovered
  const pagesAnalyzed = crawl?.pagesAnalyzed ?? meta.pagesAnalyzed
  const pagesVerified = crawl?.pagesVerified
  const pagesBlocked = crawl?.pagesBlocked
  const pagesSkippedAnalysis = crawl?.pagesSkippedAnalysis

  if (pagesDiscovered > 0) {
    lines.push({
      kind: "success",
      text: `${pagesDiscovered} page${pagesDiscovered === 1 ? "" : "s"} discovered during crawl`,
    })
  }

  if (pagesVerified != null && pagesVerified > 0) {
    lines.push({
      kind: "success",
      text: `${pagesVerified} page${pagesVerified === 1 ? "" : "s"} successfully crawled`,
    })
  } else if (meta.pagesReachable > 0) {
    lines.push({
      kind: "success",
      text: `${meta.pagesReachable} page${meta.pagesReachable === 1 ? "" : "s"} reachable`,
    })
  }

  if (pagesAnalyzed > 0) {
    lines.push({
      kind: "success",
      text: `${pagesAnalyzed} page${pagesAnalyzed === 1 ? "" : "s"} analyzed by the audit engine`,
    })
  }

  const traces = crawl?.pageTraces ?? []
  if (traces.length > 0) {
    const rendered = traces.filter(
      (trace) => trace.contentSource === "rendered" && trace.renderCompleted
    ).length
    const staticOnly = traces.filter((trace) => trace.contentSource === "static").length
    const failedRender = traces.filter(
      (trace) => trace.pageAcquired && trace.contentSource !== "rendered" && !trace.renderCompleted
    ).length

    if (rendered > 0) {
      lines.push({
        kind: "success",
        text: `${rendered} page${rendered === 1 ? "" : "s"} successfully browser-rendered`,
      })
    }

    if (staticOnly > 0) {
      lines.push({
        kind: "info",
        text: `${staticOnly} page${staticOnly === 1 ? "" : "s"} analyzed from static HTML only`,
      })
    }

    if (failedRender > 0) {
      lines.push({
        kind: "warning",
        text: `${failedRender} page${failedRender === 1 ? "" : "s"} could not be browser-rendered`,
      })
    }
  }

  if (pagesBlocked != null && pagesBlocked > 0) {
    lines.push({
      kind: "warning",
      text: `${pagesBlocked} page${pagesBlocked === 1 ? "" : "s"} blocked during crawl`,
    })
  }

  if (meta.pagesUnreachable > 0) {
    lines.push({
      kind: "warning",
      text: `${meta.pagesUnreachable} page${meta.pagesUnreachable === 1 ? "" : "s"} unreachable`,
    })
  }

  if (pagesSkippedAnalysis != null && pagesSkippedAnalysis > 0) {
    lines.push({
      kind: "warning",
      text: `${pagesSkippedAnalysis} page${pagesSkippedAnalysis === 1 ? "" : "s"} skipped analysis`,
    })
  }

  if (render) {
    const renderPercent = Math.round(render.score * 100)
    if (render.trustworthyForUxRules) {
      lines.push({
        kind: "success",
        text: `Rendered DOM is trustworthy for UX checks (${renderPercent}% render trust)`,
      })
    } else {
      lines.push({
        kind: "warning",
        text: `Render trust is ${renderPercent}% (${formatRenderLevel(render.level)}) — some DOM checks may be incomplete`,
      })
    }

    const notableSignals = render.signals.filter(
      (signal) => signal !== "no-analyzable-pages"
    )
    for (const signal of notableSignals.slice(0, 3)) {
      lines.push({
        kind: "warning",
        text: `Render signal detected: ${humanizeSignal(signal)}`,
      })
    }
  } else if (reliability?.renderConfidenceScore != null) {
    const renderPercent = Math.round(reliability.renderConfidenceScore * 100)
    lines.push({
      kind: reliability.renderConfidenceScore >= 0.85 ? "success" : "warning",
      text: `Render trust is ${renderPercent}% (${formatRenderLevel(reliability.renderConfidenceLevel)})`,
    })
  }

  if (reliability) {
    const { verificationStats, highRiskPlatform, manualVerificationCount, auditConfidenceImpact } =
      reliability

    if (verificationStats.unverifiedFindings > 0 || verificationStats.skippedLowConfidence > 0) {
      const unverifiedTotal =
        verificationStats.unverifiedFindings + verificationStats.skippedLowConfidence
      lines.push({
        kind: "warning",
        text: `${unverifiedTotal} render-sensitive check${unverifiedTotal === 1 ? "" : "s"} could not be verified`,
      })
    } else if (verificationStats.exceedsThreshold) {
      lines.push({
        kind: "warning",
        text: "Some render-sensitive checks could not be verified",
      })
    }

    if (auditConfidenceImpact === "reduced") {
      lines.push({
        kind: "warning",
        text: "Confidence reduced because too many DOM-dependent checks were unverified",
      })
    }

    if (highRiskPlatform) {
      lines.push({
        kind: "warning",
        text: "Protected or search-dominant site — conversion checks need high render confidence",
      })
    }

    if (manualVerificationCount > 0) {
      lines.push({
        kind: "warning",
        text: `${manualVerificationCount} finding${manualVerificationCount === 1 ? "" : "s"} marked for manual verification`,
      })
    }
  }

  if (meta.manualVerificationRecommended) {
    const hasManualLine = lines.some((line) =>
      line.text.toLowerCase().includes("manual verification")
    )
    if (!hasManualLine) {
      lines.push({
        kind: "warning",
        text: "Manual verification recommended for some findings",
      })
    }
  }

  return lines
}
