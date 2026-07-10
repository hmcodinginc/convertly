import { ROUTES } from "@/lib/routes"

function readEnv(key: string): string {
  return import.meta.env[key]?.trim() ?? ""
}

/**
 * Deployment origin for auth email redirects.
 * Prefers VITE_APP_URL when set; otherwise uses the active browser origin.
 */
export function getAppOrigin(): string {
  const configured = readEnv("VITE_APP_URL").replace(/\/+$/, "")
  if (configured) return configured

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/+$/, "")
  }

  return ""
}

/**
 * Email confirmation links redirect here after the user confirms signup.
 */
export function getEmailConfirmationRedirectUrl(): string {
  return `${getAppOrigin()}${ROUTES.dashboard}`
}

/**
 * Logged-out forgot-password emails redirect here (standalone recovery page).
 */
export function getPasswordResetRedirectUrl(): string {
  return `${getAppOrigin()}${ROUTES.resetPassword}`
}

/**
 * Logged-in change-password drawer emails return to Settings → Profile.
 */
export function getInAppPasswordResetRedirectUrl(): string {
  return `${getAppOrigin()}${ROUTES.profile}`
}

export function isPasswordRecoveryLanding(): boolean {
  if (typeof window === "undefined") return false

  const hash = window.location.hash
  const search = window.location.search

  return hash.includes("type=recovery") || search.includes("type=recovery")
}

export function isStandaloneRecoveryLanding(): boolean {
  if (typeof window === "undefined") return false
  if (!isPasswordRecoveryLanding()) return false

  const { pathname } = window.location
  return pathname === ROUTES.resetPassword
}

export function isInAppRecoveryLanding(): boolean {
  if (typeof window === "undefined") return false
  if (!isPasswordRecoveryLanding()) return false

  const { pathname } = window.location
  return pathname === ROUTES.profile || pathname.startsWith(`${ROUTES.settings}/`)
}

/**
 * Reference URLs for Supabase Dashboard → Authentication → URL Configuration.
 * Add every environment you deploy to the Redirect URLs allowlist.
 */
export const PASSWORD_RESET_REDIRECT_ALLOWLIST = {
  standaloneLocal: "http://localhost:5173/reset-password",
  standaloneLocalAlt: "http://127.0.0.1:5173/reset-password",
  standaloneStage: "https://convertly-qxoh.vercel.app/reset-password",
  inAppLocal: "http://localhost:5173/settings/profile",
  inAppLocalAlt: "http://127.0.0.1:5173/settings/profile",
  inAppStage: "https://convertly-qxoh.vercel.app/settings/profile",
} as const
