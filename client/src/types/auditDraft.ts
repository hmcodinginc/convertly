import type { AuditTemplateId } from "@/lib/auditTypes"

export type AuditDraft = {
  id: string
  websiteUrl: string
  auditType: AuditTemplateId
  createdAt: string
  updatedAt: string
}

export type SaveAuditDraftInput = {
  url: string
  auditType: AuditTemplateId
  draftId?: string
}
