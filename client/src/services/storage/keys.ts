export const STORAGE_KEYS = {
  session: "convertly_session",
  users: "convertly_users",
  createdAudits: "convertly_created_audits",
  hasUserAudits: "convertly_has_user_audits",
  auditDetailPrefix: "convertly_audit_detail_",
  auditSessions: "convertly_audit_sessions",
  auditPages: "convertly_audit_pages",
  auditFindings: "convertly_audit_findings",
  auditScores: "convertly_audit_scores",
  auditHistory: "convertly_audit_history",
} as const

export function auditDetailStorageKey(id: string): string {
  return `${STORAGE_KEYS.auditDetailPrefix}${id}`
}
