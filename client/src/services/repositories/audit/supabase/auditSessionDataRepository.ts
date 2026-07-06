import { getSupabaseClient } from "@/services/auth/supabaseClient"
import {
  mapAuditRowToSession,
  mapFindingRowToFinding,
  mapHistoryRowToEvent,
  mapPageRowToAuditPage,
  mapScoreRowToScore,
} from "@/services/repositories/audit/mappers"
import type { AuditSessionData } from "@/types/auditEngine"
import type { Database } from "@/types/database"

type AuditWithRelations = Database["public"]["Tables"]["audits"]["Row"] & {
  audit_pages: Database["public"]["Tables"]["audit_pages"]["Row"][]
  audit_findings: Database["public"]["Tables"]["audit_findings"]["Row"][]
  audit_scores: Database["public"]["Tables"]["audit_scores"]["Row"][]
  audit_history: Database["public"]["Tables"]["audit_history"]["Row"][]
}

export async function getAuditSessionDataById(
  auditId: string
): Promise<AuditSessionData | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audits")
    .select(
      "*, audit_pages(*), audit_findings(*), audit_scores(*), audit_history(*)"
    )
    .eq("id", auditId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const row = data as unknown as AuditWithRelations

  return {
    session: mapAuditRowToSession(row),
    pages: (row.audit_pages ?? [])
      .map(mapPageRowToAuditPage)
      .sort((a, b) => a.discoveredAt.localeCompare(b.discoveredAt)),
    findings: (row.audit_findings ?? [])
      .map(mapFindingRowToFinding)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    scores: (row.audit_scores ?? []).map(mapScoreRowToScore),
    history: (row.audit_history ?? [])
      .map(mapHistoryRowToEvent)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }
}
