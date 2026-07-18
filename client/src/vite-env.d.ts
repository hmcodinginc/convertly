/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_APP_URL?: string
  readonly VITE_USE_LOCAL_AUTH?: string
  readonly VITE_TURNSTILE_SITE_KEY?: string
  readonly VITE_AUDIT_RENDER_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}