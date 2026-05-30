import { Sparkles } from "lucide-react"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { AuthSlideFrame } from "@/features/auth/components/AuthSlideFrame"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { AUTH_SHOWCASE_SLIDES } from "@/features/auth/content/authContent"
import { aiRecommendations } from "@/features/dashboard/data/mockData"

const slide = AUTH_SHOWCASE_SLIDES[2]

const priorityVariant = {
  Critical: "danger",
  High: "warning",
  Medium: "neutral",
} as const

const showcaseRecommendations = aiRecommendations.slice(0, 2)

function AuthSlideRecommendations() {
  return (
    <AuthSlideFrame
      eyebrow={slide.eyebrow}
      title={slide.title}
      description={slide.description}
    >
      <div className="flex h-full flex-col gap-2.5">
        {showcaseRecommendations.map((rec) => (
          <Card key={rec.id} className="auth-showcase-rec flex-1 hover:translate-y-0">
            <div className="flex h-full flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[0.65rem] font-medium tracking-wide text-foreground/65 uppercase">
                  <Sparkles
                    className="size-3 text-[color-mix(in_srgb,var(--accent)_80%,white)]"
                    aria-hidden
                  />
                  {rec.category}
                </span>
                <StatusBadge
                  label={rec.priority}
                  variant={priorityVariant[rec.priority]}
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  {rec.title}
                </h3>
                <Text variant="muted" size="sm" className="max-w-none text-xs leading-5">
                  {rec.summary}
                </Text>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 border-t border-[color-mix(in_srgb,var(--border)_55%,transparent)] pt-2.5">
                <Text size="sm" className="max-w-none text-xs font-medium text-[#86efac]">
                  {rec.estimatedLift}
                </Text>
                <span className="text-xs font-medium text-foreground/55">View playbook →</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AuthSlideFrame>
  )
}

export { AuthSlideRecommendations }
