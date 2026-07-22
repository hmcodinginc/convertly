import { buildAuditDetailFromSession } from "@/services/audit/auditDetailBuilder"
import { buildAiReport, serializeAiReport } from "@/services/export/buildAiReport"
import { buildPdfReport } from "@/services/export/buildPdfReport"
import { downloadBlob } from "@/services/export/download"
import { buildAiReportFilename, buildPdfFilename } from "@/services/export/filenames"
import type { ExportFormat, ExportPayload } from "@/services/export/types"
import * as auditService from "@/services/auditService"
import { trackProductEvent } from "@/services/analytics/productAnalytics"
import type { AuditDetail } from "@/types/audit"

async function loadExportAudit(auditId: string): Promise<{
  detail: AuditDetail
  sessionData: Awaited<ReturnType<typeof auditService.getAuditSessionDataById>>
}> {
  const detail = await auditService.getAuditDetail(auditId)
  if (!detail) {
    throw new Error("Audit report not found.")
  }

  const sessionData = await auditService.getAuditSessionDataById(auditId)
  return { detail, sessionData }
}

export async function createExportPayload(
  auditId: string,
  format: Exclude<ExportFormat, "developer-package">
): Promise<ExportPayload> {
  const { detail, sessionData } = await loadExportAudit(auditId)
  const completedAt = detail.completedAtDate ?? detail.completedAt

  if (format === "ai-report") {
    const report = buildAiReport(detail, sessionData)
    const blob = new Blob([serializeAiReport(report)], {
      type: "application/json;charset=utf-8",
    })
    return {
      format: "ai-report",
      blob,
      filename: buildAiReportFilename(detail.domain, completedAt),
    }
  }

  const blob = await buildPdfReport(detail)
  return {
    format: "pdf",
    blob,
    filename: buildPdfFilename(detail.domain, completedAt),
  }
}

export async function exportAuditReport(
  auditId: string,
  format: Exclude<ExportFormat, "developer-package">
): Promise<void> {
  const payload = await createExportPayload(auditId, format)
  downloadBlob(payload.blob, payload.filename)
  trackProductEvent("report_exported", { auditId, format })
}

/**
 * Reconstructs an audit detail from a previously exported AI report.
 * Useful for validating export completeness and future import flows.
 */
export function reconstructAuditDetailFromAiReport(
  report: ReturnType<typeof buildAiReport>
): AuditDetail {
  const { audit } = report
  return {
    id: audit.id,
    name: audit.name,
    domain: audit.website.domain,
    websiteUrl: audit.website.url,
    createdAt: audit.createdAt,
    completedAtDate: audit.completedAtDate,
    completedAt: audit.completedAt,
    pagesAnalyzed: audit.runMetadata.pagesAnalyzed || audit.pageAnalysis.length,
    overallScore: audit.scores.growthScore,
    previousScore: audit.scores.previousScore,
    scoreDelta: audit.scores.scoreDelta,
    status: audit.status,
    issues: audit.prioritizedIssues,
    siteFindings: audit.siteFindings,
    recommendations: audit.recommendations,
    scoreBreakdown: audit.dimensions,
    pageFindings: audit.pageAnalysis,
    timeline: audit.timeline,
    stats: audit.stats,
    runMetadata: audit.runMetadata,
  }
}

export { buildAiReport, buildPdfReport }

/** Validates round-trip fidelity when session data is available. */
export async function verifyAiReportRoundTrip(auditId: string): Promise<boolean> {
  const { detail, sessionData } = await loadExportAudit(auditId)
  if (!sessionData) return false

  const exported = buildAiReport(detail, sessionData)
  const reconstructed = reconstructAuditDetailFromAiReport(exported)
  const fromSession = buildAuditDetailFromSession(sessionData)

  return (
    reconstructed.overallScore === fromSession.overallScore &&
    reconstructed.pageFindings.length === fromSession.pageFindings.length &&
    reconstructed.recommendations.length === fromSession.recommendations.length
  )
}
