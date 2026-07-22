import { shouldUseSupabaseAudits } from "@/lib/env"
import { getSupabaseClient } from "@/services/auth/supabaseClient"

/**
 * Fire-and-forget request for the audit-complete / score-drop emails.
 * Delivery and preference checks happen server-side; failures here must
 * never affect the audit flow.
 */
export function requestAuditCompletedEmail(auditId: string): void {
  if (!shouldUseSupabaseAudits()) return

  void (async () => {
    try {
      const supabase = getSupabaseClient()
      await supabase.functions.invoke("email-notifications", {
        method: "POST",
        body: { auditId },
      })
    } catch {
      // Email delivery is best-effort — never surface errors to the audit flow.
    }
  })()
}
