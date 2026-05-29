export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  auditNew: "/audit/new",
  audits: "/audits",
  auditDetail: "/audits/:id",
  workspace: "/workspace",
  billing: "/billing",
  settings: "/settings",
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

export function auditDetailPath(id: string): string {
  return `/audits/${id}`
}
