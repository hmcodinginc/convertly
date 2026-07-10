import { getSupabaseClient } from "@/services/auth/supabaseClient"
import {
  auditFindingToInsert,
  mapFindingRowToFinding,
} from "@/services/repositories/audit/mappers"
import type { AuditFinding } from "@/types/auditEngine"
import type { Database } from "@/types/database"

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

type FindingWithPageRow = Database["public"]["Tables"]["audit_findings"]["Row"] & {
  audit_pages: Pick<Database["public"]["Tables"]["audit_pages"]["Row"], "path"> | null
}

export type FindingWithPagePath = {
  finding: AuditFinding
  pagePath?: string
}

export async function getFindingsForUser(): Promise<FindingWithPagePath[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audit_findings")
    .select("*, audit_pages(path)")
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)

  return ((data ?? []) as unknown as FindingWithPageRow[]).map((row) => ({
    finding: mapFindingRowToFinding(row),
    pagePath: row.audit_pages?.path,
  }))
}
