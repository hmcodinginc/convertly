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
