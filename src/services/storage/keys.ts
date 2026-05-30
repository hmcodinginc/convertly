export const STORAGE_KEYS = {
  session: "convertly_session",
  users: "convertly_users",
  createdAudits: "convertly_created_audits",
  hasUserAudits: "convertly_has_user_audits",
  auditDetailPrefix: "convertly_audit_detail_",
} as const

export function auditDetailStorageKey(id: string): string {
  return `${STORAGE_KEYS.auditDetailPrefix}${id}`
}
