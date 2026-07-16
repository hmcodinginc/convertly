import { getSupabaseClient } from "@/services/auth/supabaseClient"
import type { AuditEntitlementLedgerSnapshot } from "@/types/workspaceUsageBreakdown"
import type { Database } from "@/types/database"

type LedgerRow = Database["public"]["Tables"]["audit_entitlement_ledger"]["Row"]

function mapLedgerRow(row: LedgerRow): AuditEntitlementLedgerSnapshot {
  return {
    id: row.id,
    auditId: row.audit_id,
    websiteUrl: row.website_url,
    auditType: row.audit_type,
    completedAt: row.completed_at,
    consumedAt: row.consumed_at,
  }
}

export async function getLedgerSnapshotsForUser(
  userId: string
): Promise<AuditEntitlementLedgerSnapshot[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audit_entitlement_ledger")
    .select()
    .eq("user_id", userId)
    .order("consumed_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapLedgerRow)
}
