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
 * Password-reset emails redirect here after the user follows the Supabase link.
 * Recovery is handled on the profile page (drawer auto-opens in recovery mode).
 */
export function getPasswordResetRedirectUrl(): string {
  return `${getAppOrigin()}${ROUTES.profile}`
}

export function isPasswordRecoveryLanding(): boolean {
  if (typeof window === "undefined") return false

  const hash = window.location.hash
  const search = window.location.search

  return hash.includes("type=recovery") || search.includes("type=recovery")
}

/**
 * Reference URLs for Supabase Dashboard → Authentication → URL Configuration.
 * Add every environment you deploy to the Redirect URLs allowlist.
 */
export const PASSWORD_RESET_REDIRECT_ALLOWLIST = {
  local: "http://localhost:5173/profile",
  localAlt: "http://127.0.0.1:5173/profile",
  stage: "https://convertly-qxoh.vercel.app/profile",
  resetPasswordFallback: "http://localhost:5173/reset-password",
} as const
