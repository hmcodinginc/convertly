export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  sampleReport: "/sample-report",
  dashboard: "/dashboard",
  auditNew: "/audit/new",
  audits: "/audits",
  auditDetail: "/audits/:id",
  workspace: "/workspace",
  billing: "/billing",
  settings: "/settings",
  profile: "/profile",
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

export function auditDetailPath(id: string): string {
  return `/audits/${id}`
}
