import { Link } from "react-router-dom"

import { BusinessFoundationRequired } from "@/components/business/BusinessFoundationRequired"
import { SettingsSectionCard } from "@/components/settings/SettingsSectionCard"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography/Text"
import { useAuthSession } from "@/hooks/useAuthSession"
import { isBusinessFoundationEnabled } from "@/lib/businessFoundation"
import { ROUTES } from "@/lib/routes"

function SettingsSecurityPage() {
  const { account } = useAuthSession()

  if (!isBusinessFoundationEnabled()) {
    return <BusinessFoundationRequired />
  }

  return (
    <SettingsSectionCard
      title="Security"
      description="Password and sign-in settings for your Convertly account."
    >
      <div className="space-y-4">
        <div className="rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_55%,transparent)] bg-[color-mix(in_srgb,var(--surface)_50%,transparent)] px-4 py-3">
          <Text size="sm" className="max-w-none font-medium">
            Authentication provider
          </Text>
          <Text variant="muted" size="sm" className="mt-1 max-w-none">
            {account?.authProvider ?? "Email"}
          </Text>
        </div>
        <Text variant="muted" size="sm" className="max-w-none leading-6">
          Change your password or recover access from your profile page. Two-factor authentication
          is not yet available.
        </Text>
        <Button variant="outline" size="sm" asChild>
          <Link to={ROUTES.profile}>Open profile & security</Link>
        </Button>
      </div>
    </SettingsSectionCard>
  )
}

export default SettingsSecurityPage
