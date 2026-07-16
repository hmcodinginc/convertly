import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

import { Container } from "@/components/layout/Container"
import { Navbar } from "@/components/layout/Navbar"
import { Card } from "@/components/surfaces/Card"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { ROUTES } from "@/lib/routes"

function AboutPage() {
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
              About Convertly
            </Heading>
            <Text variant="muted" className="max-w-[64ch] leading-7">
              Convertly is an AI-assisted conversion audit product by HM Coding. It helps product,
              growth, and marketing teams review public website journeys, surface friction, and
              prioritize improvements with structured reports.
            </Text>
          </div>

          <Card className="space-y-4 p-6 hover:translate-y-0">
            <Heading level={2} size="subsection" className="max-w-none">
              What Convertly does
            </Heading>
            <Text variant="muted" className="max-w-none leading-7">
              Convertly analyzes publicly reachable pages, applies deterministic audit rules, and
              presents findings, scores, and recommendations in a format teams can act on quickly.
            </Text>
            <Text variant="muted" className="max-w-none leading-7">
              The product is currently in launch hardening. We prioritize correctness, audit
              quality, and clear operator feedback over broad feature surface.
            </Text>
          </Card>

          <Card className="space-y-4 p-6 hover:translate-y-0">
            <Heading level={2} size="subsection" className="max-w-none">
              Company
            </Heading>
            <Text variant="muted" className="max-w-none leading-7">
              Convertly is owned and operated by HM Coding, India.
            </Text>
            <Text variant="muted" className="max-w-none leading-7">
              Contact: <a href="mailto:hello@convertly.com" className="text-[var(--accent)] hover:underline">hello@convertly.com</a>
            </Text>
          </Card>
        </div>
      </Container>
    </main>
  )
}

export default AboutPage
