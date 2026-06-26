export type ImpactEvidenceRow = {
  label: string
  value: string
}

export type ParsedImpact = {
  pageFromImpact?: string
  evidence: ImpactEvidenceRow[]
}

export function parseImpactForDisplay(impact: string): ParsedImpact {
  let body = impact.trim()
  let pageFromImpact: string | undefined

  const onPageMatch = body.match(/^On ([^,]+),\s*(.+)$/s)
  if (onPageMatch) {
    const candidate = onPageMatch[1].trim()
    if (candidate.startsWith("/")) {
      pageFromImpact = candidate
    }
    body = onPageMatch[2].trim()
  }

  const evidence: ImpactEvidenceRow[] = []

  if (body.includes(":")) {
    const segments = body.split(/\. (?=[A-Za-z0-9][^:]{0,48}:)/)
    for (const segment of segments) {
      const trimmed = segment.trim().replace(/\.$/, "")
      const colonIndex = trimmed.indexOf(":")
      if (colonIndex > 0) {
        evidence.push({
          label: trimmed.slice(0, colonIndex).trim(),
          value: trimmed.slice(colonIndex + 1).trim(),
        })
      }
    }
  }

  return { pageFromImpact, evidence }
}

export function hasMeaningfulScoreTrend(trendValue: string): boolean {
  const value = trendValue.trim()
  return Boolean(value) && value !== "0" && value !== "—" && value !== "+0" && value !== "-0"
}
