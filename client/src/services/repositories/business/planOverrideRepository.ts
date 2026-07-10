import { getSupabaseClient } from "@/services/auth/supabaseClient"
import type { UserPlanOverrideRow } from "@/types/planOverride"

export async function getActivePlanOverrideByUserId(
  userId: string
): Promise<UserPlanOverrideRow | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("user_plan_overrides")
    .select("*")
    .eq("user_id", userId)
    .eq("enabled", true)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}
