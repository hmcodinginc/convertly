import { createLogger } from "@/lib/logger"

type EnvConfig = {
  supabaseUrl: string
  supabaseAnonKey: string
  appUrl: string
  useLocalAuth: boolean
}

function readEnv(key: string): string {
  return import.meta.env[key]?.trim() ?? ""
}

export const env: EnvConfig = {
  supabaseUrl: readEnv("VITE_SUPABASE_URL"),
  supabaseAnonKey: readEnv("VITE_SUPABASE_ANON_KEY"),
  appUrl: readEnv("VITE_APP_URL"),
  useLocalAuth: readEnv("VITE_USE_LOCAL_AUTH") !== "false",
}

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey)
}

export function shouldUseLocalAuth(): boolean {
  return env.useLocalAuth || !isSupabaseConfigured()
}

/** Supabase-backed audit persistence requires Supabase auth + configured project */
export function shouldUseSupabaseAudits(): boolean {
  return isSupabaseConfigured() && !shouldUseLocalAuth()
}

export function isAuditRenderConfigured(): boolean {
  return Boolean(readEnv("VITE_AUDIT_RENDER_URL"))
}

export function warnIfProductionMisconfigured(): void {
  if (!import.meta.env.PROD) return

  const logger = createLogger("env")

  if (shouldUseLocalAuth()) {
    logger.warn(
      "Production build is using local auth. Set VITE_USE_LOCAL_AUTH=false and configure Supabase."
    )
  }

  if (!isSupabaseConfigured()) {
    logger.warn("Production build is missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.")
  }
}
