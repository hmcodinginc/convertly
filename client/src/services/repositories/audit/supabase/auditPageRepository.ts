import { getSupabaseClient } from "@/services/auth/supabaseClient"
import {
  auditPageToInsert,
  mapPageRowToAuditPage,
} from "@/services/repositories/audit/mappers"
import type { AuditPage } from "@/types/auditEngine"

export async function createPages(pages: AuditPage[]): Promise<AuditPage[]> {
  if (pages.length === 0) return []

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audit_pages")
    .insert(pages.map(auditPageToInsert))
    .select()

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapPageRowToAuditPage)
}

export async function getPagesByAuditId(auditId: string): Promise<AuditPage[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audit_pages")
    .select()
    .eq("audit_id", auditId)
    .order("discovered_at", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapPageRowToAuditPage)
}

export async function getPageById(id: string): Promise<AuditPage | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("audit_pages").select().eq("id", id).maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapPageRowToAuditPage(data) : null
}

export async function updatePage(
  id: string,
  patch: Partial<Pick<AuditPage, "title">>
): Promise<AuditPage | null> {
  if (!patch.title) return getPageById(id)

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("audit_pages")
    .update({ title: patch.title })
    .eq("id", id)
    .select()
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapPageRowToAuditPage(data) : null
}
