import type { Issue, IssueSeverity, SiteFinding } from "@/types/audit"

export type SeverityCounts = Record<IssueSeverity, number>

const SEVERITY_ORDER: IssueSeverity[] = ["Critical", "High", "Medium", "Low"]

export function countSeverities(
  issues: Issue[],
  siteFindings: SiteFinding[] = []
): SeverityCounts {
  const counts: SeverityCounts = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  }

  for (const item of [...issues, ...siteFindings]) {
    counts[item.severity] += 1
  }

  return counts
}

export function severityItems(counts: SeverityCounts) {
  return SEVERITY_ORDER.map((severity) => ({
    severity,
    count: counts[severity],
  })).filter((item) => item.count > 0)
}

export const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  Critical: "#f87171",
  High: "#fbbf24",
  Medium: "#94a3b8",
  Low: "#64748b",
}
