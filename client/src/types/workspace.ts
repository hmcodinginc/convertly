export type WorkspaceDomain = {
  id: string
  hostname: string
  isPrimary: boolean
  lastAudited: string
}

export type TeamMemberRole = "Owner" | "Admin" | "Member"
export type TeamMemberStatus = "Active" | "Invited"

export type TeamMember = {
  id: string
  name: string
  email: string
  role: TeamMemberRole
  status: TeamMemberStatus
}

export type WorkspaceCompany = {
  name: string
  industry: string
  teamSize: string
  timezone: string
}

export type WorkspaceAuditLimits = {
  plan: string
  auditsUsed: number
  auditsIncluded: number
  pagesPerAudit: number
  retentionDays: number
}

export type WorkspaceSnapshot = {
  company: WorkspaceCompany
  domains: WorkspaceDomain[]
  team: TeamMember[]
  auditLimits: WorkspaceAuditLimits
}
