import type { Audit, AuditDetail } from "@/types/audit"

function isCompletedAudit(audit: Audit): boolean {
  return audit.status === "completed" || audit.status === "Completed"
}

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase()
}

export function findPreviousCompletedAudit(
  audits: Audit[],
  current: Pick<AuditDetail, "id" | "domain" | "completedAt">
): Audit | null {
  const domain = normalizeDomain(current.domain)

  return (
    audits
      .filter(
        (audit) =>
          audit.id !== current.id &&
          isCompletedAudit(audit) &&
          normalizeDomain(audit.domain) === domain
      )
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0] ?? null
  )
}

export function applyScoreDeltaFromHistory(
  detail: AuditDetail,
  audits: Audit[]
): AuditDetail {
  const previous = findPreviousCompletedAudit(audits, detail)
  if (!previous) {
    return detail
  }

  const previousScore = previous.conversionScore
  const scoreDelta = detail.overallScore - previousScore

  return {
    ...detail,
    previousScore,
    scoreDelta,
  }
}

export function computeAverageScoreTrend(audits: Audit[]): {
  average: number
  delta: number
  sampleSize: number
} {
  const completed = audits.filter(isCompletedAudit)
  if (completed.length === 0) {
    return { average: 0, delta: 0, sampleSize: 0 }
  }

  const recent = completed.slice(0, 5)
  const prior = completed.slice(5, 10)

  const average = Math.round(
    recent.reduce((sum, audit) => sum + audit.conversionScore, 0) / recent.length
  )

  if (prior.length === 0) {
    return { average, delta: 0, sampleSize: recent.length }
  }

  const priorAverage =
    prior.reduce((sum, audit) => sum + audit.conversionScore, 0) / prior.length

  return {
    average,
    delta: Math.round(average - priorAverage),
    sampleSize: recent.length,
  }
}
