import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { AuthShowcaseMetricVisual } from "@/features/auth/components/AuthShowcaseVisuals"
import { Text } from "@/components/ui/typography/Text"
import { cn } from "@/lib/utils"
import type { DashboardMetric } from "@/types/dashboard"

type AuthShowcaseMetricCardProps = {
  metric: DashboardMetric
  compact?: boolean
}

function AuthShowcaseMetricCard({ metric, compact = false }: AuthShowcaseMetricCardProps) {
  const TrendIcon = metric.trend === "down" ? ArrowDownRight : ArrowUpRight
  const trendColor =
    metric.trend === "down" ? "text-[#fca5a5]" : "text-[#86efac]"

  return (
    <div className={cn("auth-showcase-tile flex h-full flex-col", compact && "p-3.5")}>
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
        <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", trendColor)}>
          <TrendIcon className="size-3" aria-hidden />
          {metric.change}
        </span>
      </div>
      <div className="mt-auto pt-3">
        <AuthShowcaseMetricVisual metricId={metric.id} />
      </div>
    </div>
  )
}

export { AuthShowcaseMetricCard }
