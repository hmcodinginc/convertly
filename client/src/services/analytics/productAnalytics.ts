import { shouldUseSupabaseAudits } from "@/lib/env"
import { getSupabaseClient } from "@/services/auth/supabaseClient"

export type ProductEventName =
  | "signup"
  | "login"
  | "audit_started"
  | "audit_completed"
  | "audit_failed"
  | "report_exported"
  | "checkout_started"
  | "plan_activated"

/**
 * Fire-and-forget first-party product analytics. Events are stored in the
 * `product_events` table (insert-only RLS). Never throws and never blocks
 * the calling flow; silently does nothing in local/dev mode.
 */
export function trackProductEvent(
  event: ProductEventName,
  properties: Record<string, string | number | boolean | null> = {}
): void {
  if (!shouldUseSupabaseAudits()) return

  void (async () => {
    try {
      const supabase = getSupabaseClient()
      const { data } = await supabase.auth.getSession()
      const userId = data.session?.user?.id
      if (!userId) return

      await supabase.from("product_events").insert({
        user_id: userId,
        event,
        properties,
      })
    } catch {
      // Analytics must never affect product behavior.
    }
  })()
}
