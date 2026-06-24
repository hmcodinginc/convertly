import { ArrowRight, Globe, ListOrdered, Sparkles, TrendingUp } from "lucide-react"

import { AuthSlideFrame } from "@/features/auth/components/AuthSlideFrame"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { AUTH_SHOWCASE_SLIDES } from "@/features/auth/content/authContent"

const slide = AUTH_SHOWCASE_SLIDES[3]

const workflowSteps = [
  {
    icon: Globe,
    label: "Website",
    detail: "Connect your URL and funnel context",
  },
  {
    icon: Sparkles,
    label: "AI analysis",
    detail: "Map friction, intent gaps, and trust signals",
  },
  {
    icon: ListOrdered,
    label: "Prioritized actions",
    detail: "Rank fixes by likely revenue impact",
  },
  {
    icon: TrendingUp,
    label: "Results",
    detail: "Track scores, lift, and rollout progress",
  },
] as const

function AuthSlideWorkflow() {
  return (
    <AuthSlideFrame
      eyebrow={slide.eyebrow}
      title={slide.title}
      description={slide.description}
    >
      <div className="flex h-full flex-col justify-center gap-2">
        {workflowSteps.map((step, index) => (
          <div key={step.label} className="flex items-center gap-2">
            <Card className="auth-showcase-step flex-1 hover:translate-y-0">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))]">
                  <step.icon
                    className="size-4 text-[color-mix(in_srgb,var(--accent)_75%,white)]"
                    aria-hidden
                  />
                </span>
                <div className="min-w-0">
                  <Text size="sm" className="max-w-none font-medium text-foreground/90">
                    {step.label}
                  </Text>
                  <Text variant="muted" size="sm" className="max-w-none text-xs leading-4">
                    {step.detail}
                  </Text>
                </div>
              </div>
            </Card>
            {index < workflowSteps.length - 1 ? (
              <ArrowRight
                className="size-4 shrink-0 text-foreground/35"
                aria-hidden
              />
            ) : (
              <span className="size-4 shrink-0" aria-hidden />
            )}
          </div>
        ))}
      </div>
    </AuthSlideFrame>
  )
}

export { AuthSlideWorkflow }
