import { getSupabaseClient } from "@/services/auth/supabaseClient"
import { mapHistoryRowToEvent } from "@/services/repositories/audit/mappers"
import type { AuditHistoryEvent, AuditSessionStatus } from "@/types/auditEngine"

export async function createHistoryEvent(
  auditId: string,
  status: AuditSessionStatus,
  message: string
): Promise<AuditHistoryEvent> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audit_history")
    .insert({ audit_id: auditId, status, message })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapHistoryRowToEvent(data)
}

export async function getHistoryByAuditId(auditId: string): Promise<AuditHistoryEvent[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audit_history")
    .select()
    .eq("audit_id", auditId)
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapHistoryRowToEvent)
}
