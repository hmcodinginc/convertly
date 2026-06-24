import { getSupabaseClient } from "@/services/auth/supabaseClient"
import {
  auditScoreToInsert,
  mapScoreRowToScore,
} from "@/services/repositories/audit/mappers"
import type { AuditScore, AuditScoreCategory } from "@/types/auditEngine"

export async function createScores(scores: AuditScore[]): Promise<AuditScore[]> {
  if (scores.length === 0) return []

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audit_scores")
    .insert(scores.map(auditScoreToInsert))
    .select()

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapScoreRowToScore)
}

export async function upsertScores(scores: AuditScore[]): Promise<AuditScore[]> {
  if (scores.length === 0) return []

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audit_scores")
    .upsert(scores.map(auditScoreToInsert), { onConflict: "audit_id,category" })
    .select()

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapScoreRowToScore)
}

export async function getScoresByAuditId(auditId: string): Promise<AuditScore[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audit_scores")
    .select()
    .eq("audit_id", auditId)

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapScoreRowToScore)
}

export async function getScoreByCategory(
  auditId: string,
  category: AuditScoreCategory
): Promise<AuditScore | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audit_scores")
    .select()
    .eq("audit_id", auditId)
    .eq("category", category)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapScoreRowToScore(data) : null
}
