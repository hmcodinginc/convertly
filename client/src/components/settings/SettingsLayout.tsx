import { Outlet } from "react-router-dom"

import { SettingsNav } from "@/components/settings/SettingsNav"
import { AppPageHeader } from "@/components/layout/AppPageHeader"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { Card } from "@/components/surfaces/Card"

function SettingsLayout() {
  return (
    <AppPageShell
      header={
        <AppPageHeader
          eyebrow="Account"
          title="Settings"
          description="Manage preferences, notifications, and account security."
        />
      }
    >
      <div className="settings-layout">
        <Card className="settings-layout__nav app-card-body hover:translate-y-0">
          <SettingsNav />
        </Card>
        <div className="settings-layout__content">
          <Outlet />
        </div>
      </div>
    </AppPageShell>
  )
}

export { SettingsLayout }
