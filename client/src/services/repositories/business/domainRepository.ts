import { getSupabaseClient } from "@/services/auth/supabaseClient"
import type { WorkspaceDomainRow } from "@/types/businessDatabase"
import type { CreateDomainInput, UpdateDomainInput } from "@/types/workspace"

function normalizeHostname(hostname: string): string {
  return hostname
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .split("/")[0] ?? ""
}

export async function listDomains(workspaceId: string): Promise<WorkspaceDomainRow[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("workspace_domains")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createDomain(
  workspaceId: string,
  input: CreateDomainInput
): Promise<WorkspaceDomainRow> {
  const hostname = normalizeHostname(input.hostname)
  if (!hostname) {
    throw new Error("Enter a valid domain hostname.")
  }

  const supabase = getSupabaseClient()

  if (input.isPrimary) {
    await supabase
      .from("workspace_domains")
      .update({ is_primary: false })
      .eq("workspace_id", workspaceId)
  }

  const { data, error } = await supabase
    .from("workspace_domains")
    .insert({
      workspace_id: workspaceId,
      hostname,
      is_primary: input.isPrimary ?? false,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      throw new Error("This domain is already in your workspace.")
    }
    throw new Error(error.message)
  }

  return data
}

export async function updateDomain(
  domainId: string,
  workspaceId: string,
  input: UpdateDomainInput
): Promise<WorkspaceDomainRow> {
  const supabase = getSupabaseClient()
  const patch: {
    hostname?: string
    is_primary?: boolean
    last_audited_at?: string | null
  } = {}

  if (input.hostname !== undefined) {
    const hostname = normalizeHostname(input.hostname)
    if (!hostname) throw new Error("Enter a valid domain hostname.")
    patch.hostname = hostname
  }

  if (input.isPrimary === true) {
    await supabase
      .from("workspace_domains")
      .update({ is_primary: false })
      .eq("workspace_id", workspaceId)
    patch.is_primary = true
  } else if (input.isPrimary === false) {
    patch.is_primary = false
  }

  const { data, error } = await supabase
    .from("workspace_domains")
    .update(patch)
    .eq("id", domainId)
    .eq("workspace_id", workspaceId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteDomain(domainId: string, workspaceId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from("workspace_domains")
    .delete()
    .eq("id", domainId)
    .eq("workspace_id", workspaceId)

  if (error) throw new Error(error.message)
}

export async function touchDomainLastAudited(
  workspaceId: string,
  websiteUrl: string
): Promise<void> {
  const hostname = normalizeHostname(websiteUrl)
  if (!hostname) return

  const supabase = getSupabaseClient()
  await supabase
    .from("workspace_domains")
    .update({ last_audited_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("hostname", hostname)
}
