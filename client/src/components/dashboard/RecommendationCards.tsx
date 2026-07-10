import { Sparkles } from "lucide-react"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { EmptyState } from "@/components/feedback/EmptyState"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { ROUTES } from "@/lib/routes"
import type { Recommendation } from "@/types/audit"
import { cn } from "@/lib/utils"

const priorityVariant = {
  Critical: "danger",
  High: "warning",
  Medium: "neutral",
} as const

type RecommendationCardsProps = {
  recommendations: Recommendation[]
  emptyActionTo?: string
  className?: string
}

function RecommendationCards({
  recommendations,
  emptyActionTo = ROUTES.auditNew,
  className,
}: RecommendationCardsProps) {
  if (recommendations.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No recommendations yet"
        description="Run an audit to generate AI-powered conversion recommendations for your funnel."
        action={{ label: "Run audit", to: emptyActionTo }}
      />
    )
  }

  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", className)}>
      {recommendations.map((rec) => (
        <Card key={rec.id} className="app-card-metric flex h-full flex-col hover:translate-y-0">
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-foreground/70 uppercase">
                <Sparkles
                  className="size-3.5 text-[color-mix(in_srgb,var(--accent)_80%,white)]"
                  aria-hidden
                />
                {rec.category}
              </span>
              <StatusBadge
                label={rec.priority}
                variant={priorityVariant[rec.priority]}
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                {rec.title}
              </h3>
              <Text variant="muted" size="sm" className="max-w-none leading-6">
                {rec.summary}
              </Text>
            </div>
            <div className="mt-auto flex items-center justify-between gap-3 border-t border-[color-mix(in_srgb,var(--border)_55%,transparent)] pt-4">
              <Text size="sm" className="max-w-none font-medium text-[#86efac]">
                {rec.estimatedLift}
              </Text>
              <button
                type="button"
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                View playbook →
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export { RecommendationCards }
