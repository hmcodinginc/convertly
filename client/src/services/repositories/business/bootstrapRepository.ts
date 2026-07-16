import { getSupabaseClient } from "@/services/auth/supabaseClient"

export async function bootstrapBusinessFoundation(): Promise<string> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.rpc("bootstrap_business_foundation")

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error("Unable to initialize account workspace.")
  }

  return data
}

export async function getPersonalWorkspaceId(userId: string): Promise<string | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.rpc("get_personal_workspace_id", {
    p_user_id: userId,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? null
}
