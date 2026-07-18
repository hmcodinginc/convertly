import { createLogger } from "@/lib/logger"

type EnvConfig = {
  supabaseUrl: string
  supabaseAnonKey: string
  appUrl: string
  useLocalAuth: boolean
  turnstileSiteKey: string
}

function readEnv(key: string): string {
  return import.meta.env[key]?.trim() ?? ""
}

export const env: EnvConfig = {
  supabaseUrl: readEnv("VITE_SUPABASE_URL"),
  supabaseAnonKey: readEnv("VITE_SUPABASE_ANON_KEY"),
  appUrl: readEnv("VITE_APP_URL"),
  useLocalAuth: readEnv("VITE_USE_LOCAL_AUTH") !== "false",
  turnstileSiteKey: readEnv("VITE_TURNSTILE_SITE_KEY"),
}

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey)
}

/**
 * Local auth is for development only.
 * Production builds always use Supabase Auth when configured,
 * and hard-fail at boot if Supabase credentials are missing.
 */
export function shouldUseLocalAuth(): boolean {
  if (import.meta.env.PROD) {
    return false
  }
  return env.useLocalAuth || !isSupabaseConfigured()
}

/** Supabase-backed audit persistence requires Supabase auth + configured project */
export function shouldUseSupabaseAudits(): boolean {
  return isSupabaseConfigured() && !shouldUseLocalAuth()
}

export function isAuditRenderConfigured(): boolean {
  return Boolean(readEnv("VITE_AUDIT_RENDER_URL"))
}

/**
 * CAPTCHA is enabled when a Turnstile site key is configured
 * and the app is using Supabase Auth (not local auth).
 */
export function isCaptchaEnabled(): boolean {
  return Boolean(env.turnstileSiteKey) && !shouldUseLocalAuth()
}

export function warnIfProductionMisconfigured(): void {
  if (!import.meta.env.PROD) return

  const logger = createLogger("env")

  if (!isSupabaseConfigured()) {
    logger.error(
      "Production build is missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY."
    )
    throw new Error(
      "Production misconfiguration: Supabase Auth is required. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, and VITE_USE_LOCAL_AUTH=false."
    )
  }

  if (env.useLocalAuth) {
    logger.warn(
      "VITE_USE_LOCAL_AUTH is not set to false. Production builds ignore local auth and always use Supabase."
    )
  }

  if (!env.turnstileSiteKey) {
    logger.error(
      "VITE_TURNSTILE_SITE_KEY is not set. Production CAPTCHA is required."
    )
    throw new Error(
      "Production misconfiguration: set VITE_TURNSTILE_SITE_KEY and enable Cloudflare Turnstile in Supabase Auth."
    )
  }
}
