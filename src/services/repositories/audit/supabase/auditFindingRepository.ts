import { getSupabaseClient } from "@/services/auth/supabaseClient"
import {
  auditFindingToInsert,
  mapFindingRowToFinding,
} from "@/services/repositories/audit/mappers"
import type { AuditFinding } from "@/types/auditEngine"

export async function createFindings(findings: AuditFinding[]): Promise<AuditFinding[]> {
  if (findings.length === 0) return []

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audit_findings")
    .insert(findings.map(auditFindingToInsert))
    .select()

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapFindingRowToFinding)
}

export async function getFindingsByAuditId(auditId: string): Promise<AuditFinding[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audit_findings")
    .select()
    .eq("audit_id", auditId)
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapFindingRowToFinding)
}
