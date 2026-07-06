import { getSupabaseClient } from "@/services/auth/supabaseClient"
import type {
  NotificationPreferencesRow,
  UserPreferencesRow,
} from "@/types/businessDatabase"
import type {
  NotificationPreferences,
  UpdateNotificationPreferencesInput,
  UpdateUserPreferencesInput,
  UserPreferences,
} from "@/types/settings"

function mapNotificationRow(row: NotificationPreferencesRow): NotificationPreferences {
  return {
    userId: row.user_id,
    weeklyDigest: row.weekly_digest,
    auditCompleteEmail: row.audit_complete_email,
    scoreDropAlerts: row.score_drop_alerts,
    scoreDropThreshold: row.score_drop_threshold,
    updatedAt: row.updated_at,
  }
}

function mapUserPreferencesRow(row: UserPreferencesRow): UserPreferences {
  return {
    userId: row.user_id,
    timezone: row.timezone,
    updatedAt: row.updated_at,
  }
}

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapNotificationRow(data) : null
}

export async function updateNotificationPreferences(
  userId: string,
  input: UpdateNotificationPreferencesInput
): Promise<NotificationPreferences> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("notification_preferences")
    .update({
      weekly_digest: input.weeklyDigest,
      audit_complete_email: input.auditCompleteEmail,
      score_drop_alerts: input.scoreDropAlerts,
      score_drop_threshold: input.scoreDropThreshold,
    })
    .eq("user_id", userId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapNotificationRow(data)
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapUserPreferencesRow(data) : null
}

export async function updateUserPreferences(
  userId: string,
  input: UpdateUserPreferencesInput
): Promise<UserPreferences> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("user_preferences")
    .update({ timezone: input.timezone.trim() || "UTC" })
    .eq("user_id", userId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapUserPreferencesRow(data)
}
