import { ROUTES } from "@/lib/routes"

/**
 * Password-reset emails redirect here after the user follows the Supabase link.
 * Uses the current deployment origin so localhost, stage, and production each get the correct URL.
 */
export function getPasswordResetRedirectUrl(): string {
  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin.replace(/\/+$/, "")
      : ""
  return `${origin}${ROUTES.resetPassword}`
}

/**
 * Reference URLs for Supabase Dashboard → Authentication → URL Configuration.
 * Add every environment you deploy to the Redirect URLs allowlist.
 */
export const PASSWORD_RESET_REDIRECT_ALLOWLIST = {
  local: "http://localhost:5173/reset-password",
  localAlt: "http://127.0.0.1:5173/reset-password",
  stage: "https://<stage-host>/reset-password",
  production: "https://<production-host>/reset-password",
} as const
