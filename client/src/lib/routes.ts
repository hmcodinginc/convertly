export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  sampleReport: "/sample-report",
  legalTerms: "/legal/terms",
  legalPrivacy: "/legal/privacy",
  about: "/about",
  security: "/security",
  dashboard: "/dashboard",
  auditNew: "/audit/new",
  audits: "/audits",
  auditDetail: "/audits/:id",
  workspace: "/workspace",
  billing: "/billing",
  billingReturn: "/billing/return",
  settings: "/settings",
  settingsProfile: "/settings/profile",
  settingsPreferences: "/settings/preferences",
  settingsNotifications: "/settings/notifications",
  settingsSecurity: "/settings/security",
  settingsDangerZone: "/settings/danger-zone",
  /** Profile lives under Settings; legacy `/profile` redirects here. */
  profile: "/settings/profile",
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

export function auditDetailPath(id: string): string {
  return `/audits/${id}`
}
