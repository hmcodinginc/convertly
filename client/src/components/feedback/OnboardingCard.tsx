import { ArrowRight, Globe, LineChart, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/surfaces/Card"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"

const steps = [
  {
    step: 1,
    title: "Add website",
    description: "Enter your primary domain to establish a conversion baseline.",
    icon: Globe,
  },
  {
    step: 2,
    title: "Run audit",
    description: "Scan key funnel pages for friction, clarity, and trust signals.",
    icon: LineChart,
  },
  {
    step: 3,
    title: "Review recommendations",
    description: "Prioritize AI-generated fixes ranked by modeled revenue impact.",
    icon: Sparkles,
  },
] as const

type OnboardingCardProps = {
  className?: string
}

function OnboardingCard({ className }: OnboardingCardProps) {
  return (
    <Card className={cn("overflow-hidden p-0 hover:translate-y-0", className)}>
      <div className="border-b border-[color-mix(in_srgb,var(--border)_65%,transparent)] px-6 py-5 sm:px-8">
        <Heading level={2} size="subsection" className="max-w-none text-xl">
          Get started with Convertly
        </Heading>
        <Text variant="muted" size="sm" className="mt-2 max-w-2xl leading-6">
          Complete these steps to launch your first conversion audit and unlock dashboard
          insights.
        </Text>
      </div>
      <div className="grid gap-px bg-[color-mix(in_srgb,var(--border)_50%,transparent)] md:grid-cols-3">
        {steps.map((item) => (
          <div
            key={item.step}
            className="flex flex-col gap-3 bg-[color-mix(in_srgb,var(--card)_96%,transparent)] p-6 sm:p-8"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] text-xs font-semibold text-foreground">
                {item.step}
              </span>
              <item.icon className="size-4 text-foreground/55" aria-hidden />
            </div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              {item.title}
            </h3>
            <Text variant="muted" size="sm" className="max-w-none leading-6">
              {item.description}
            </Text>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color-mix(in_srgb,var(--border)_65%,transparent)] px-6 py-5 sm:px-8">
        <Text variant="muted" size="sm" className="max-w-none">
          Most teams complete setup in under 5 minutes.
        </Text>
        <Button size="sm" asChild>
          <Link to={ROUTES.auditNew}>
            Start first audit
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </Card>
  )
}

export { OnboardingCard }
