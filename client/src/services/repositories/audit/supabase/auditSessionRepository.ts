import { getSupabaseClient } from "@/services/auth/supabaseClient"
import { mapAuditRowToSession } from "@/services/repositories/audit/mappers"
import type { AuditSession, AuditSessionStatus } from "@/types/auditEngine"
import type { Database } from "@/types/database"

type AuditUpdate = Database["public"]["Tables"]["audits"]["Update"]

type CreateSessionInput = {
  userId: string
  websiteUrl: string
  workspaceId?: string
  status?: AuditSessionStatus
  auditType?: string
}

export async function createSession(input: CreateSessionInput): Promise<AuditSession> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audits")
    .insert({
      user_id: input.userId,
      website_url: input.websiteUrl,
      status: input.status ?? "pending",
      audit_type: input.auditType ?? "full-funnel",
      workspace_id: input.workspaceId ?? null,
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

export async function getDraftSessionsByUserId(userId: string): Promise<AuditSession[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audits")
    .select()
    .eq("user_id", userId)
    .eq("status", "draft")
    .order("updated_at", { ascending: false })

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

export async function updateSessionFields(
  id: string,
  patch: {
    websiteUrl?: string
    auditType?: string
    status?: AuditSessionStatus
    errorMessage?: string | null
  }
): Promise<AuditSession | null> {
  const supabase = getSupabaseClient()
  const update: AuditUpdate = {}

  if (patch.websiteUrl !== undefined) update.website_url = patch.websiteUrl
  if (patch.auditType !== undefined) update.audit_type = patch.auditType
  if (patch.status !== undefined) update.status = patch.status
  if (patch.errorMessage !== undefined) update.error_message = patch.errorMessage

  const { data, error } = await supabase
    .from("audits")
    .update(update)
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
