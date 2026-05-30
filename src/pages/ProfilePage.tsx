import { Link } from "react-router-dom"

import { useAuthSession } from "@/components/auth/AuthSessionProvider"
import { PageLoading } from "@/components/feedback/PageState"
import { AppPageHeader } from "@/components/layout/AppPageHeader"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { Card } from "@/components/surfaces/Card"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography/Text"
import { ROUTES } from "@/lib/routes"

function formatAccountDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

const accountFields = [
  { key: "fullName", label: "Full Name" },
  { key: "email", label: "Email" },
  { key: "createdAt", label: "Account Created" },
  { key: "plan", label: "Current Plan" },
  { key: "authProvider", label: "Authentication Provider" },
] as const

function ProfilePage() {
  const { account, isLoading } = useAuthSession()

  if (isLoading) {
    return (
      <AppPageShell>
        <PageLoading label="Loading profile…" />
      </AppPageShell>
    )
  }

  if (!account) {
    return (
      <AppPageShell
        header={
          <AppPageHeader
            eyebrow="Account"
            title="Profile"
            description="Your Convertly account details."
          />
        }
      >
        <Card className="app-card-body app-card-stack hover:translate-y-0">
          <Text variant="muted" size="sm" className="max-w-none">
            Unable to load account information. Try signing in again.
          </Text>
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.login}>Go to login</Link>
          </Button>
        </Card>
      </AppPageShell>
    )
  }

  const values: Record<(typeof accountFields)[number]["key"], string> = {
    fullName: account.fullName,
    email: account.email,
    createdAt: formatAccountDate(account.createdAt),
    plan: account.plan,
    authProvider: account.authProvider,
  }

  return (
    <AppPageShell
      header={
        <AppPageHeader
          eyebrow="Account"
          title="Profile"
          description="View your Convertly account details and authentication information."
        />
      }
    >
      <Card className="app-card-body app-card-stack hover:translate-y-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7c6cff_0%,#5d7dff_52%,#35b3ff_100%)] text-base font-semibold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
            >
              {account.initials}
            </span>
            <div>
              <Text size="sm" className="max-w-none font-medium">
                {account.fullName}
              </Text>
              <Text variant="muted" size="sm" className="mt-1 max-w-none">
                {account.email}
              </Text>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.settings}>Account settings</Link>
          </Button>
        </div>

        <dl className="space-y-4 border-t border-[color-mix(in_srgb,var(--border)_50%,transparent)] pt-5">
          {accountFields.map((field) => (
            <div
              key={field.key}
              className="flex flex-col gap-1 border-b border-[color-mix(in_srgb,var(--border)_50%,transparent)] pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <dt>
                <Text size="sm" className="max-w-none font-medium text-foreground/85">
                  {field.label}
                </Text>
              </dt>
              <dd>
                <Text variant="muted" size="sm" className="max-w-none sm:text-right">
                  {values[field.key]}
                </Text>
              </dd>
            </div>
          ))}
        </dl>
      </Card>
    </AppPageShell>
  )
}

export default ProfilePage
