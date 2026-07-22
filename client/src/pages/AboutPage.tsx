import { ArrowLeft, Gauge, Image, MessageSquare, ShieldCheck, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"

import { Container } from "@/components/layout/Container"
import { Navbar } from "@/components/layout/Navbar"
import { Card } from "@/components/surfaces/Card"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { LEGAL_CONTACT_EMAIL, LEGAL_ENTITY_NAME } from "@/features/auth/content/legalConstants"
import { ROUTES } from "@/lib/routes"

const HIGHLIGHTS = [
  {
    icon: Gauge,
    title: "Growth Score (Intelligence v4)",
    body: "Weighted conversion impact across conversion, trust, mobile, and UX — not a raw issue count.",
  },
  {
    icon: ShieldCheck,
    title: "SPA-aware reliability",
    body: "Softens form and DOM findings when render confidence is low, so JS-heavy sites get fewer false positives.",
  },
  {
    icon: Image,
    title: "Open Graph Page Preview",
    body: "Report cards show the site’s published og:image as a supporting thumbnail — not a live screenshot capture.",
  },
  {
    icon: MessageSquare,
    title: "Vertly product specialist",
    body: "In-app guidance on audits, billing, and workspace — Convertly-scoped, not a general chatbot.",
  },
  {
    icon: Sparkles,
    title: "Playbooks & exports",
    body: "Prioritized recommendations with implementation playbooks, plus PDF and structured report exports.",
  },
] as const

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
              Convertly is conversion intelligence for product, growth, and marketing teams. It
              audits public websites for trust, UX, CTAs, forms, and growth blockers — then returns
              a Growth Score with prioritized recommendations you can ship.
            </Text>
          </div>

          <Card className="space-y-4 p-6 hover:translate-y-0">
            <Heading level={2} size="subsection" className="max-w-none">
              What Convertly does
            </Heading>
            <Text variant="muted" className="max-w-none leading-7">
              Convertly discovers publicly reachable pages, acquires HTML (static and optionally
              rendered), applies intent-aware conversion rules, and presents findings, scores, and
              playbooks in a report your team can act on quickly. Audits run in the browser tab —
              keep it open until completion.
            </Text>
            <Text variant="muted" className="max-w-none leading-7">
              We are a conversion / CRO product — not an SEO platform, keyword tracker, or full
              Lighthouse suite. Light technical signals appear only as supporting context inside the
              conversion report.
            </Text>
          </Card>

          <div className="space-y-3">
            <Heading level={2} size="subsection" className="max-w-none">
              What you get today
            </Heading>
            <div className="grid gap-3 sm:grid-cols-1">
              {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
                <Card key={title} className="flex gap-4 p-5 hover:translate-y-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color-mix(in_srgb,var(--surface)_70%,transparent)]">
                    <Icon className="size-4 text-foreground/70" aria-hidden />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <Heading level={3} size="subsection" className="max-w-none text-base font-semibold sm:text-base">
                      {title}
                    </Heading>
                    <Text variant="muted" size="sm" className="max-w-none leading-6">
                      {body}
                    </Text>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Card className="space-y-4 p-6 hover:translate-y-0">
            <Heading level={2} size="subsection" className="max-w-none">
              Product surface
            </Heading>
            <Text variant="muted" className="max-w-none leading-7">
              Beyond audits: dashboard opportunity queue, drafts, workspace domains and usage
              ledger, Razorpay billing (Free / Starter / Growth / Scale), settings, optional email
              notifications, and a public sample report so you can see the product before you sign
              up.
            </Text>
          </Card>

          <Card className="space-y-4 p-6 hover:translate-y-0">
            <Heading level={2} size="subsection" className="max-w-none">
              Company
            </Heading>
            <Text variant="muted" className="max-w-none leading-7">
              Convertly is owned and operated by {LEGAL_ENTITY_NAME}, India.
            </Text>
            <Text variant="muted" className="max-w-none leading-7">
              Contact:{" "}
              <a
                href={`mailto:${LEGAL_CONTACT_EMAIL}`}
                className="text-[var(--accent)] hover:underline"
              >
                {LEGAL_CONTACT_EMAIL}
              </a>
            </Text>
            <Text variant="muted" size="sm" className="max-w-none leading-6">
              See also{" "}
              <Link to={ROUTES.legalTerms} className="text-[var(--accent)] hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link to={ROUTES.legalPrivacy} className="text-[var(--accent)] hover:underline">
                Privacy
              </Link>
              .
            </Text>
          </Card>
        </div>
      </Container>
    </main>
  )
}

export default AboutPage
