import type { SelectableAuditTemplateId } from "@/lib/auditTypes"

export type AuditDraft = {
  id: string
  websiteUrl: string
  auditType: SelectableAuditTemplateId
  createdAt: string
  updatedAt: string
}

export type SaveAuditDraftInput = {
  url: string
  auditType: SelectableAuditTemplateId
  draftId?: string
}
