export type WorkspaceDomain = {
  id: string
  hostname: string
  isPrimary: boolean
  lastAudited: string
}

export type TeamMember = {
  id: string
  name: string
  email: string
  role: "Owner" | "Admin" | "Member"
  status: "Active" | "Invited"
}

export const workspaceCompany = {
  name: "Acme Growth",
  industry: "B2B SaaS",
  teamSize: "11–50",
  timezone: "America/New_York",
}

export const workspaceDomains: WorkspaceDomain[] = [
  {
    id: "dom-1",
    hostname: "acme.io",
    isPrimary: true,
    lastAudited: "May 28, 2026",
  },
  {
    id: "dom-2",
    hostname: "acme.io/enterprise",
    isPrimary: false,
    lastAudited: "May 24, 2026",
  },
  {
    id: "dom-3",
    hostname: "docs.acme.io",
    isPrimary: false,
    lastAudited: "May 12, 2026",
  },
]

export const workspaceTeam: TeamMember[] = [
  {
    id: "tm-1",
    name: "Jordan Lee",
    email: "jordan@acme.io",
    role: "Owner",
    status: "Active",
  },
  {
    id: "tm-2",
    name: "Sam Rivera",
    email: "sam@acme.io",
    role: "Admin",
    status: "Active",
  },
  {
    id: "tm-3",
    name: "Alex Chen",
    email: "alex@acme.io",
    role: "Member",
    status: "Invited",
  },
]

export const workspaceAuditLimits = {
  plan: "Growth",
  auditsUsed: 12,
  auditsIncluded: 20,
  pagesPerAudit: 200,
  retentionDays: 90,
}
