export const AUDIT_TYPE_OPTIONS = [
  {
    id: "full-funnel",
    title: "Full funnel audit",
    description:
      "Scan landing, pricing, signup, and checkout paths to surface end-to-end conversion leaks.",
    duration: "~18 min",
  },
  {
    id: "page-specific",
    title: "Page-specific audit",
    description:
      "Deep-dive a single URL for UX, copy, CTA placement, and technical performance signals.",
    duration: "~4 min",
  },
  {
    id: "competitive",
    title: "Competitive benchmark",
    description:
      "Compare your key pages against up to three competitors on clarity, trust, and friction.",
    duration: "~25 min",
  },
] as const

export type AuditTemplateId = (typeof AUDIT_TYPE_OPTIONS)[number]["id"]

export function isAuditTemplateId(value: string): value is AuditTemplateId {
  return AUDIT_TYPE_OPTIONS.some((option) => option.id === value)
}

export function getAuditTypeLabel(auditType: string): string {
  return AUDIT_TYPE_OPTIONS.find((option) => option.id === auditType)?.title ?? "Audit"
}

export function getDefaultAuditTemplateId(): AuditTemplateId {
  return AUDIT_TYPE_OPTIONS[0].id
}
