import { isSupabaseConfigured, shouldUseLocalAuth } from "@/lib/env"

export function isBusinessFoundationEnabled(): boolean {
  return isSupabaseConfigured() && !shouldUseLocalAuth()
}

export function assertBusinessFoundationEnabled(): void {
  if (!isBusinessFoundationEnabled()) {
    throw new Error(
      "Workspace, billing, and settings require Supabase authentication. Configure VITE_SUPABASE_URL and set VITE_USE_LOCAL_AUTH=false."
    )
  }
}
