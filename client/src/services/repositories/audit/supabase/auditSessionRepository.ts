import { getSupabaseClient } from "@/services/auth/supabaseClient"
import { mapAuditRowToSession } from "@/services/repositories/audit/mappers"
import type { AuditSession, AuditSessionStatus } from "@/types/auditEngine"

export async function createSession(
  userId: string,
  websiteUrl: string,
  workspaceId?: string
): Promise<AuditSession> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audits")
    .insert({
      user_id: userId,
      website_url: websiteUrl,
      status: "pending",
      workspace_id: workspaceId ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapAuditRowToSession(data)
}

export async function getSessionById(id: string): Promise<AuditSession | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("audits").select().eq("id", id).maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapAuditRowToSession(data) : null
}

export async function getSessionsByUserId(userId: string): Promise<AuditSession[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audits")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapAuditRowToSession)
}

export async function updateSessionStatus(
  id: string,
  status: AuditSessionStatus,
  errorMessage?: string
): Promise<AuditSession | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audits")
    .update({
      status,
      error_message: errorMessage ?? null,
    })
    .eq("id", id)
    .select()
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapAuditRowToSession(data) : null
}

export async function deleteAudit(auditId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from("audits").delete().eq("id", auditId)

  if (error) throw new Error(error.message)
}
