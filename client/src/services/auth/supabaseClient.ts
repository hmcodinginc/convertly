import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { env, isSupabaseConfigured } from "@/lib/env"
import type { Database } from "@/types/database"

function normalizeSupabaseUrl(url: string): string {
  return url.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "")
}

let supabaseClient: SupabaseClient<Database> | null = null

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    )
  }

  if (!supabaseClient) {
    supabaseClient = createClient<Database>(
      normalizeSupabaseUrl(env.supabaseUrl),
      env.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    )
  }

  return supabaseClient
}

export function resetSupabaseClient(): void {
  supabaseClient = null
}
