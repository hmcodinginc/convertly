export type OverridePlanId = "starter" | "growth" | "scale" | "internal"

export type UserPlanOverrideRow = {
  id: string
  user_id: string
  email: string
  override_plan: OverridePlanId
  enabled: boolean
  notes: string | null
  created_at: string
  updated_at: string
}
