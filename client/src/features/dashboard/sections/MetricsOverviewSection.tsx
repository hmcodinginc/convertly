import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { AppPageSection } from "@/components/layout/AppPageSection"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { cn } from "@/lib/utils"
import type { DashboardMetric } from "@/types/dashboard"

const trendIcon = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  neutral: Minus,
} as const

const trendColor = {
  up: "text-[#86efac]",
  down: "text-[#fca5a5]",
  neutral: "text-muted",
} as const

type MetricsOverviewSectionProps = {
  metrics: DashboardMetric[]
}

function MetricsOverviewSection({ metrics }: MetricsOverviewSectionProps) {
  return (
    <AppPageSection
      eyebrow="Overview"
      title="Metrics overview"
      description="Live conversion health across your audited properties."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const TrendIcon = trendIcon[metric.trend]

          return (
            <Card key={metric.id} className="app-card-metric hover:translate-y-0">
              <div className="space-y-4">
                <Text variant="muted" size="sm" className="max-w-none font-medium">
                  {metric.label}
                </Text>
                <div className="flex items-end justify-between gap-3">
                  <p className="text-3xl font-medium tracking-tight text-foreground">
                    {metric.value}
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-sm font-medium",
                      trendColor[metric.trend]
                    )}
                  >
                    <TrendIcon className="size-3.5" aria-hidden />
                    {metric.change}
                  </span>
                </div>
                <Text variant="muted" size="sm" className="max-w-none text-xs leading-5">
                  {metric.hint}
                </Text>
              </div>
            </Card>
          )
        })}
      </div>
    </AppPageSection>
  )
}

export { MetricsOverviewSection }
