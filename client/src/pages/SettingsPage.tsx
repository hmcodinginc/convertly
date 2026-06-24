import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/routes"
import { AppPageHeader } from "@/components/layout/AppPageHeader"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"

const settingsSections = [
  {
    id: "notifications",
    title: "Notifications",
    description: "Email digests and alerts when audits complete or scores drop.",
    fields: [
      { label: "Weekly digest", value: "Enabled · Mondays 9:00 AM" },
      { label: "Score drop alerts", value: "Enabled · below 65" },
    ],
  },
  {
    id: "integrations",
    title: "Integrations",
    description: "Connect analytics and experimentation tools (coming soon).",
    fields: [
      { label: "Google Analytics", value: "Not connected" },
      { label: "Segment", value: "Not connected" },
    ],
  },
  {
    id: "account",
    title: "Account",
    description: "Profile and security preferences for your Convertly account.",
    fields: [
      { label: "Profile details", value: "View name, email, and sign-in method" },
      { label: "Two-factor auth", value: "Coming soon" },
    ],
  },
] as const

function SettingsPage() {
  return (
    <AppPageShell
      header={
        <AppPageHeader
          eyebrow="Account"
          title="Settings"
          description="Manage notifications, integrations, and account preferences."
        />
      }
    >
      <Card className="app-card-body flex flex-col gap-3 hover:translate-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Text size="sm" className="max-w-none font-medium">
            Workspace & billing
          </Text>
          <Text variant="muted" size="sm" className="mt-1 max-w-none">
            Company info, domains, and subscription are managed separately.
          </Text>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.workspace}>Workspace</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.billing}>Billing</Link>
          </Button>
        </div>
      </Card>

      {settingsSections.map((section) => (
        <Card key={section.id} className="app-card-body app-card-stack hover:translate-y-0">
          <SectionHeader
            variant="app"
            title={section.title}
            description={section.description}
          />
          <dl className="space-y-4">
            {section.fields.map((field) => (
              <div
                key={field.label}
                className="flex flex-col gap-1 border-b border-[color-mix(in_srgb,var(--border)_50%,transparent)] pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <dt>
                  <Text size="sm" className="max-w-none font-medium text-foreground/85">
                    {field.label}
                  </Text>
                </dt>
                <dd>
                  <Text variant="muted" size="sm" className="max-w-none sm:text-right">
                    {field.value}
                  </Text>
                </dd>
              </div>
            ))}
          </dl>
          {section.id === "account" ? (
            <Button variant="outline" size="sm" asChild>
              <Link to={ROUTES.profile}>View profile</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              Edit {section.title.toLowerCase()}
            </Button>
          )}
        </Card>
      ))}
    </AppPageShell>
  )
}

export default SettingsPage
