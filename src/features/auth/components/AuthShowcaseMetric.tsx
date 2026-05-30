import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

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

type AuthShowcaseMetricProps = {
  metric: DashboardMetric
  compact?: boolean
}

function AuthShowcaseMetric({ metric, compact = false }: AuthShowcaseMetricProps) {
  const TrendIcon = trendIcon[metric.trend]

  return (
    <Card className="auth-showcase-metric hover:translate-y-0">
      <Text variant="muted" size="sm" className="max-w-none text-xs font-medium">
        {metric.label}
      </Text>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p
          className={cn(
            "font-medium tracking-tight text-foreground",
            compact ? "text-xl" : "text-2xl"
          )}
        >
          {metric.value}
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-xs font-medium",
            trendColor[metric.trend]
          )}
        >
          <TrendIcon className="size-3" aria-hidden />
          {metric.change}
        </span>
      </div>
      {!compact && metric.hint ? (
        <Text variant="muted" size="sm" className="mt-2 max-w-none text-[0.7rem] leading-4">
          {metric.hint}
        </Text>
      ) : null}
    </Card>
  )
}

export { AuthShowcaseMetric }
