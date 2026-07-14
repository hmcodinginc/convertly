import { getSupabaseClient } from "@/services/auth/supabaseClient"
import type { SubscriptionPlanId } from "@/lib/billingPlans"
import type { SubscriptionRow, WorkspaceRow } from "@/types/businessDatabase"

export async function getPersonalWorkspace(userId: string): Promise<WorkspaceRow | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", userId)
    .eq("type", "personal")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function updateWorkspaceName(
  workspaceId: string,
  name: string
): Promise<WorkspaceRow> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("workspaces")
    .update({ name: name.trim() })
    .eq("id", workspaceId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getSubscriptionByWorkspaceId(
  workspaceId: string
): Promise<SubscriptionRow | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function getSubscriptionForUser(userId: string): Promise<SubscriptionRow | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function setPendingPlan(
  planId: SubscriptionPlanId | null
): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.rpc("set_subscription_pending_plan", {
    p_pending_plan: planId,
  })

  if (error) throw new Error(error.message)
}
