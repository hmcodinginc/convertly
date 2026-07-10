import { getSupabaseClient } from "@/services/auth/supabaseClient"
import {
  mapAuditRowToSession,
  mapScoreRowToScore,
} from "@/services/repositories/audit/mappers"
import type { AuditScore, AuditSession } from "@/types/auditEngine"
import type { Database } from "@/types/database"

type AuditListRow = Database["public"]["Tables"]["audits"]["Row"] & {
  audit_pages: Pick<Database["public"]["Tables"]["audit_pages"]["Row"], "id">[]
  audit_scores: Database["public"]["Tables"]["audit_scores"]["Row"][]
}

export type AuditListItem = {
  session: AuditSession
  pageCount: number
  scores: AuditScore[]
}

export async function getAuditListForUser(userId: string): Promise<AuditListItem[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audits")
    .select("*, audit_pages(id), audit_scores(category, score, max_score, id, audit_id, label, created_at, updated_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return ((data ?? []) as unknown as AuditListRow[]).map((row) => ({
    session: mapAuditRowToSession(row),
    pageCount: row.audit_pages?.length ?? 0,
    scores: (row.audit_scores ?? []).map(mapScoreRowToScore),
  }))
}
