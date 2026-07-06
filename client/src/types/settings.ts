export type NotificationPreferences = {
  userId: string
  weeklyDigest: boolean
  auditCompleteEmail: boolean
  scoreDropAlerts: boolean
  scoreDropThreshold: number
  updatedAt: string
}

export type UserPreferences = {
  userId: string
  timezone: string
  updatedAt: string
}

export type UpdateNotificationPreferencesInput = {
  weeklyDigest: boolean
  auditCompleteEmail: boolean
  scoreDropAlerts: boolean
  scoreDropThreshold: number
}

export type UpdateUserPreferencesInput = {
  timezone: string
}

export type SettingsSnapshot = {
  notifications: NotificationPreferences
  preferences: UserPreferences
}
