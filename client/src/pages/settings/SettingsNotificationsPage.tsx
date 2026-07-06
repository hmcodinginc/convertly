import { useState } from "react"

import { BusinessFoundationRequired } from "@/components/business/BusinessFoundationRequired"
import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { PreferenceRow } from "@/components/settings/PreferenceRow"
import { SettingsSectionCard } from "@/components/settings/SettingsSectionCard"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useAuthSession } from "@/hooks/useAuthSession"
import { useAsyncData } from "@/hooks/useAsyncData"
import { isBusinessFoundationEnabled } from "@/lib/businessFoundation"
import * as settingsService from "@/services/settingsService"

function SettingsNotificationsPage() {
  const { session } = useAuthSession()
  const userId = session?.userId ?? ""

  const { data, isLoading, isError, reload } = useAsyncData(
    () => (userId ? settingsService.getSettings(userId) : Promise.reject(new Error("Not signed in"))),
    [userId],
    { enabled: Boolean(userId) && isBusinessFoundationEnabled() }
  )

  const [weeklyDigest, setWeeklyDigest] = useState<boolean | null>(null)
  const [auditCompleteEmail, setAuditCompleteEmail] = useState<boolean | null>(null)
  const [scoreDropAlerts, setScoreDropAlerts] = useState<boolean | null>(null)
  const [scoreDropThreshold, setScoreDropThreshold] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isBusinessFoundationEnabled()) {
    return <BusinessFoundationRequired />
  }

  if (isLoading) {
    return (
      <SettingsSectionCard title="Notifications" description="Loading…">
        <div className="min-h-24" />
      </SettingsSectionCard>
    )
  }

  if (isError || !data) {
    return (
      <SettingsSectionCard title="Notifications" description="Unable to load notification settings.">
        <Button variant="outline" size="sm" onClick={() => void reload()}>
          Retry
        </Button>
      </SettingsSectionCard>
    )
  }

  const notifications = {
    weeklyDigest: weeklyDigest ?? data.notifications.weeklyDigest,
    auditCompleteEmail: auditCompleteEmail ?? data.notifications.auditCompleteEmail,
    scoreDropAlerts: scoreDropAlerts ?? data.notifications.scoreDropAlerts,
    scoreDropThreshold: scoreDropThreshold ?? data.notifications.scoreDropThreshold,
  }

  async function handleSave() {
    if (!userId) return
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await settingsService.updateNotifications(userId, notifications)
      setSuccess("Notification settings saved.")
      reload()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save notifications.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SettingsSectionCard
      title="Notifications"
      description="Email digests and alerts when audits complete or scores drop."
      footer={
        <div className="flex flex-wrap items-center gap-3">
          {success ? <AuthFormMessage variant="success">{success}</AuthFormMessage> : null}
          {error ? <AuthFormMessage>{error}</AuthFormMessage> : null}
          <Button size="sm" disabled={isSaving} onClick={() => void handleSave()}>
            {isSaving ? "Saving…" : "Save notifications"}
          </Button>
        </div>
      }
    >
      <PreferenceRow label="Weekly digest" description="Summary of audit activity each Monday.">
        <div className="flex items-center gap-2">
          <Checkbox
            id="weekly-digest"
            checked={notifications.weeklyDigest}
            onChange={(event) => setWeeklyDigest(event.target.checked)}
          />
          <Label htmlFor="weekly-digest" className="text-sm text-muted">
            Enabled
          </Label>
        </div>
      </PreferenceRow>
      <PreferenceRow label="Audit complete" description="Email when an audit finishes running.">
        <div className="flex items-center gap-2">
          <Checkbox
            id="audit-complete"
            checked={notifications.auditCompleteEmail}
            onChange={(event) => setAuditCompleteEmail(event.target.checked)}
          />
          <Label htmlFor="audit-complete" className="text-sm text-muted">
            Enabled
          </Label>
        </div>
      </PreferenceRow>
      <PreferenceRow
        label="Score drop alerts"
        description="Notify when Growth Score falls below your threshold."
      >
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Checkbox
              id="score-drop"
              checked={notifications.scoreDropAlerts}
              onChange={(event) => setScoreDropAlerts(event.target.checked)}
            />
            <Label htmlFor="score-drop" className="text-sm text-muted">
              Enabled
            </Label>
          </div>
          <input
            type="number"
            min={0}
            max={100}
            value={notifications.scoreDropThreshold}
            onChange={(event) => setScoreDropThreshold(Number(event.target.value))}
            className="app-input w-20 text-center tabular-nums"
            aria-label="Score drop threshold"
          />
        </div>
      </PreferenceRow>
    </SettingsSectionCard>
  )
}

export default SettingsNotificationsPage
