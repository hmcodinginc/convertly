export const AUDIT_TYPE_OPTIONS = [
  {
    id: "full-funnel",
    title: "Full funnel audit",
    description:
      "Scan landing, pricing, signup, and checkout paths to surface end-to-end conversion leaks.",
    duration: "~18 min",
    comingSoon: false,
  },
  {
    id: "page-specific",
    title: "Page-specific audit",
    description:
      "Deep-dive a single URL for UX, copy, CTA placement, and technical performance signals.",
    duration: "~4 min",
    comingSoon: false,
  },
  {
    id: "competitive",
    title: "Competitive Benchmark",
    description: "Compare your website against competitors.",
    launchNote: "Launching after v1.",
    comingSoon: true,
  },
] as const

export type SelectableAuditTemplateId = "full-funnel" | "page-specific"

export type AuditTemplateId = SelectableAuditTemplateId | "competitive"

export function isAuditTemplateId(value: string): value is AuditTemplateId {
  return AUDIT_TYPE_OPTIONS.some((option) => option.id === value)
}

export function isSelectableAuditType(value: string): value is SelectableAuditTemplateId {
  return value === "full-funnel" || value === "page-specific"
}

export function isComingSoonAuditType(value: string): value is "competitive" {
  return value === "competitive"
}

export function normalizeSelectableAuditType(value: string): SelectableAuditTemplateId {
  return isSelectableAuditType(value) ? value : getDefaultAuditTemplateId()
}

export function getAuditTypeLabel(auditType: string): string {
  return AUDIT_TYPE_OPTIONS.find((option) => option.id === auditType)?.title ?? "Audit"
}

export function getDefaultAuditTemplateId(): SelectableAuditTemplateId {
  return AUDIT_TYPE_OPTIONS[0].id
}

export function resolveStoredAuditType(auditType: string | undefined): SelectableAuditTemplateId {
  if (auditType && isSelectableAuditType(auditType)) {
    return auditType
  }

  return getDefaultAuditTemplateId()
}
