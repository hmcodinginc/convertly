import { useState } from "react"

import { BusinessFoundationRequired } from "@/components/business/BusinessFoundationRequired"
import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { PreferenceRow } from "@/components/settings/PreferenceRow"
import { SettingsSectionCard } from "@/components/settings/SettingsSectionCard"
import { Button } from "@/components/ui/button"
import { useAuthSession } from "@/hooks/useAuthSession"
import { useAsyncData } from "@/hooks/useAsyncData"
import { isBusinessFoundationEnabled } from "@/lib/businessFoundation"
import * as settingsService from "@/services/settingsService"

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
]

function SettingsPreferencesPage() {
  const { session } = useAuthSession()
  const userId = session?.userId ?? ""

  const { data, isLoading, isError, reload } = useAsyncData(
    () => (userId ? settingsService.getSettings(userId) : Promise.reject(new Error("Not signed in"))),
    [userId],
    { enabled: Boolean(userId) && isBusinessFoundationEnabled() }
  )

  const [timezone, setTimezone] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isBusinessFoundationEnabled()) {
    return <BusinessFoundationRequired />
  }

  if (isLoading) {
    return (
      <SettingsSectionCard title="Preferences" description="Loading…">
        <div className="min-h-24" />
      </SettingsSectionCard>
    )
  }

  if (isError || !data) {
    return (
      <SettingsSectionCard title="Preferences" description="Unable to load preferences.">
        <Button variant="outline" size="sm" onClick={() => void reload()}>
          Retry
        </Button>
      </SettingsSectionCard>
    )
  }

  const currentTimezone = timezone || data.preferences.timezone

  async function handleSave() {
    if (!userId) return
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await settingsService.updatePreferences(userId, { timezone: currentTimezone })
      setSuccess("Preferences saved.")
      reload()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save preferences.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SettingsSectionCard
      title="Preferences"
      description="Regional settings used across reports and notifications."
      footer={
        <div className="flex flex-wrap items-center gap-3">
          {success ? <AuthFormMessage variant="success">{success}</AuthFormMessage> : null}
          {error ? <AuthFormMessage>{error}</AuthFormMessage> : null}
          <Button size="sm" disabled={isSaving} onClick={() => void handleSave()}>
            {isSaving ? "Saving…" : "Save preferences"}
          </Button>
        </div>
      }
    >
      <PreferenceRow
        label="Timezone"
        description="Used for digest scheduling and report timestamps."
      >
        <select
          value={currentTimezone}
          onChange={(event) => setTimezone(event.target.value)}
          className="app-input w-full max-w-full min-w-0 sm:min-w-[14rem]"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </PreferenceRow>
    </SettingsSectionCard>
  )
}

export default SettingsPreferencesPage
