import { ArrowLeft, Lock, Server, ShieldCheck } from "lucide-react"
import { Link } from "react-router-dom"

import { Container } from "@/components/layout/Container"
import { Navbar } from "@/components/layout/Navbar"
import { Card } from "@/components/surfaces/Card"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { ROUTES } from "@/lib/routes"

const securityItems = [
  {
    icon: ShieldCheck,
    title: "Authenticated access",
    body:
      "Convertly uses authenticated account access and protected application routes for workspace data.",
  },
  {
    icon: Lock,
    title: "Scoped data access",
    body:
      "Supabase Row Level Security is used to scope user-facing database access to the signed-in account.",
  },
  {
    icon: Server,
    title: "Server-side secrets",
    body:
      "Payment credentials, webhook secrets, and privileged service keys are kept out of the client and stay in server-side function configuration.",
  },
]

function SecurityPage() {
  return (
    <main className="app-atmosphere min-h-dvh">
      <Navbar />

      <Container className="marketing-container py-10 sm:py-14">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <Link
            to={ROUTES.home}
            className="inline-flex min-h-11 items-center gap-2 text-sm text-foreground/62 transition-colors hover:text-foreground/90"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to Convertly
          </Link>

          <div className="space-y-3">
            <Heading level={1} size="title" className="max-w-none">
              Security
            </Heading>
            <Text variant="muted" className="max-w-[64ch] leading-7">
              Convertly is built with a security-first baseline appropriate for a launch-stage SaaS.
              We focus on scoped access, protected secrets, and minimizing sensitive data exposure.
            </Text>
          </div>

          <div className="grid gap-4">
            {securityItems.map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.title} className="space-y-3 p-6 hover:translate-y-0">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]">
                      <Icon className="size-5 text-[var(--accent)]" aria-hidden />
                    </div>
                    <Heading level={2} size="subsection" className="max-w-none">
                      {item.title}
                    </Heading>
                  </div>
                  <Text variant="muted" className="max-w-none leading-7">
                    {item.body}
                  </Text>
                </Card>
              )
            })}
          </div>

          <Card className="space-y-3 p-6 hover:translate-y-0">
            <Heading level={2} size="subsection" className="max-w-none">
              Contact
            </Heading>
            <Text variant="muted" className="max-w-none leading-7">
              Security questions or responsible disclosure reports can be sent to{" "}
              <a href="mailto:hmcoding.h@gmail.com" className="text-[var(--accent)] hover:underline">
                hmcoding.h@gmail.com
              </a>
              .
            </Text>
          </Card>
        </div>
      </Container>
    </main>
  )
}

export default SecurityPage
