import type { ImpactEvidenceRow, ParsedImpact } from "@/features/audits/utils/impactDisplay"
import { parseImpactForDisplay } from "@/features/audits/utils/impactDisplay"

export type HumanizedEvidenceRow = ImpactEvidenceRow & {
  displayLabel: string
  displayValue: string
}

const LABEL_OVERRIDES: Record<string, string> = {
  Buttons: "Buttons scanned",
  Links: "Links scanned",
  H1: "Primary headline",
  "Visible text": "Visible copy length",
  Forms: "Forms detected",
  "Forms detected": "Forms detected",
  "Email fields": "Email fields",
  Images: "Images scanned",
  CTAs: "Calls to action",
  "CTA count": "Calls to action",
  Navigation: "Navigation links",
  "Nav links": "Navigation links",
}

function normalizeLabel(label: string): string {
  const trimmed = label.trim()
  return LABEL_OVERRIDES[trimmed] ?? trimmed
}

function formatValue(label: string, value: string): string {
  const normalized = label.toLowerCase()

  if (normalized.includes("visible text") && /^\d+$/.test(value.trim())) {
    return `${value.trim()} characters`
  }

  if ((normalized.includes("button") || normalized.includes("link")) && /^\d+$/.test(value.trim())) {
    return value.trim()
  }

  return value
}

export function humanizeEvidenceRows(rows: ImpactEvidenceRow[]): HumanizedEvidenceRow[] {
  return rows.map((row) => ({
    ...row,
    displayLabel: normalizeLabel(row.label),
    displayValue: formatValue(row.label, row.value),
  }))
}

export function getEvidenceContextLine(title: string, evidence: ImpactEvidenceRow[]): string | null {
  const titleLower = title.toLowerCase()

  if (titleLower.includes("touch target") || titleLower.includes("tap target")) {
    return "Interactive controls were scanned to check whether they meet recommended minimum touch target sizes."
  }

  if (titleLower.includes("outcome") || titleLower.includes("headline")) {
    return "The page copy was reviewed for a clear, measurable visitor outcome above the fold."
  }

  if (titleLower.includes("trust") || titleLower.includes("testimonial")) {
    return "Trust signals on this page were compared against conversion best practices."
  }

  if (titleLower.includes("form") || titleLower.includes("signup") || titleLower.includes("lead")) {
    return "Form structure and field patterns were evaluated for friction and lead capture readiness."
  }

  if (titleLower.includes("navigation") || titleLower.includes("internal link")) {
    return "Navigation and linking patterns were checked for discoverability across the site."
  }

  if (evidence.length > 0) {
    return "Automated checks flagged measurable gaps on this page against the recommended threshold."
  }

  return null
}

export function parseImpactForPresentation(impact: string) {
  const parsed = parseImpactForDisplay(impact)
  return {
    ...parsed,
    evidence: humanizeEvidenceRows(parsed.evidence),
  }
}

export type PresentedImpact = ReturnType<typeof parseImpactForPresentation>

export { parseImpactForDisplay } from "@/features/audits/utils/impactDisplay"
export { hasMeaningfulScoreTrend } from "@/features/audits/utils/impactDisplay"
