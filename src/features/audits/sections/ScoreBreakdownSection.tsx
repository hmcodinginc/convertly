import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { AuditReportSection } from "@/features/audits/components/AuditReportSection"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import type { ScoreBreakdownItem } from "@/types/audit"
import { cn } from "@/lib/utils"

const statusVariant = {
  Strong: "success",
  "Needs work": "warning",
  Critical: "danger",
} as const

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

type ScoreBreakdownSectionProps = {
  categories: ScoreBreakdownItem[]
}

function ScoreBreakdownSection({ categories }: ScoreBreakdownSectionProps) {
  return (
    <AuditReportSection
      eyebrow="Dimensions"
      title="Score breakdown"
      description="Category-level conversion health across clarity, trust, friction, performance, and CTA strength."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {categories.map((category) => {
          const TrendIcon = trendIcon[category.trend]
          return (
            <Card key={category.id} className="app-card-metric hover:translate-y-0">
              <div className="flex items-start justify-between gap-2">
                <Text variant="muted" size="sm" className="max-w-none font-medium">
                  {category.label}
                </Text>
                <StatusBadge label={category.status} variant={statusVariant[category.status]} />
              </div>
              <p className="mt-4 text-3xl font-medium tabular-nums tracking-tight text-foreground">
                {category.score}
              </p>
              <span
                className={cn(
                  "mt-2 inline-flex items-center gap-0.5 text-sm font-medium",
                  trendColor[category.trend]
                )}
              >
                <TrendIcon className="size-3.5" aria-hidden />
                {category.trendValue} pts
              </span>
            </Card>
          )
        })}
      </div>
    </AuditReportSection>
  )
}

export { ScoreBreakdownSection }
