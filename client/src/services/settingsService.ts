import { assertBusinessFoundationEnabled } from "@/lib/businessFoundation"
import { ensureBusinessFoundation } from "@/services/businessBootstrapService"
import * as settingsRepository from "@/services/repositories/business/settingsRepository"
import type {
  NotificationPreferences,
  SettingsSnapshot,
  UpdateNotificationPreferencesInput,
  UpdateUserPreferencesInput,
  UserPreferences,
} from "@/types/settings"

export async function getSettings(userId: string): Promise<SettingsSnapshot> {
  assertBusinessFoundationEnabled()
  await ensureBusinessFoundation(userId)

  const [notifications, preferences] = await Promise.all([
    settingsRepository.getNotificationPreferences(userId),
    settingsRepository.getUserPreferences(userId),
  ])

  if (!notifications || !preferences) {
    throw new Error("Settings not found.")
  }

  return { notifications, preferences }
}

export async function updateNotifications(
  userId: string,
  input: UpdateNotificationPreferencesInput
): Promise<NotificationPreferences> {
  assertBusinessFoundationEnabled()
  await ensureBusinessFoundation(userId)
  return settingsRepository.updateNotificationPreferences(userId, input)
}

export async function updatePreferences(
  userId: string,
  input: UpdateUserPreferencesInput
): Promise<UserPreferences> {
  assertBusinessFoundationEnabled()
  await ensureBusinessFoundation(userId)
  return settingsRepository.updateUserPreferences(userId, input)
}
