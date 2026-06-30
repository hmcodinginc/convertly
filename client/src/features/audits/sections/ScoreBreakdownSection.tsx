import { ArrowDownRight, ArrowUpRight, BarChart3, Minus } from "lucide-react"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { EmptyState } from "@/components/feedback/EmptyState"
import { AuditReportSection } from "@/features/audits/components/AuditReportSection"
import { hasMeaningfulScoreTrend } from "@/features/audits/utils/impactDisplay"
import { Card } from "@/components/surfaces/Card"
import { isAuditInProgress } from "@/lib/auditStatus"
import type { AuditStatus, ScoreBreakdownItem } from "@/types/audit"
import { cn } from "@/lib/utils"

const statusVariant = {
  Strong: "success",
  "Needs work": "warning",
  Critical: "danger",
} as const

const severityVariant = {
  Critical: "danger",
  High: "warning",
  Medium: "neutral",
  Low: "neutral",
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
  auditStatus: AuditStatus
}

function getEmptyScoreMessage(status: AuditStatus): string {
  if (isAuditInProgress(status)) {
    return "Category scores will appear when analysis completes."
  }

  if (status === "failed") {
    return "No scores were recorded before this audit failed."
  }

  return "No category scores are available for this audit."
}

function ScoreImpacts({ category }: { category: ScoreBreakdownItem }) {
  if (!category.topImpacts?.length) return null

  return (
    <div className="audit-score-card__impacts">
      <p className="audit-score-card__impacts-label">Largest impacts</p>
      <ul className="audit-score-card__impacts-list">
        {category.topImpacts.map((impact) => (
          <li key={impact.title} className="audit-score-card__impact-item">
            <span className="audit-score-card__impact-title">{impact.title}</span>
            <span className="audit-score-card__impact-meta">
              {impact.count > 1 ? `${impact.count} pages` : null}
              <StatusBadge
                label={impact.severity}
                variant={severityVariant[impact.severity]}
                className="audit-score-card__impact-badge"
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ScoreBreakdownSection({ categories, auditStatus }: ScoreBreakdownSectionProps) {
  return (
    <AuditReportSection
      eyebrow="Dimensions"
      title="Score breakdown"
      description="Category-level conversion health with the findings contributing most to each score."
    >
      {categories.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No scores yet"
          description={getEmptyScoreMessage(auditStatus)}
        />
      ) : (
        <div className="audit-score-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {categories.map((category) => {
            const showTrend = hasMeaningfulScoreTrend(category.trendValue)
            const TrendIcon = trendIcon[category.trend]

            return (
              <Card key={category.id} className="audit-score-card app-card-metric hover:translate-y-0">
                <p className="audit-score-card__label">{category.label}</p>
                <p className="audit-score-card__value">{category.score}</p>
                <div className="audit-score-card__meta">
                  <StatusBadge
                    label={category.status}
                    variant={statusVariant[category.status]}
                    className="audit-score-card__badge"
                  />
                  {showTrend ? (
                    <span
                      className={cn(
                        "audit-score-card__trend",
                        trendColor[category.trend]
                      )}
                    >
                      <TrendIcon className="size-3" aria-hidden />
                      {category.trendValue} pts
                    </span>
                  ) : null}
                </div>
                <ScoreImpacts category={category} />
              </Card>
            )
          })}
        </div>
      )}
    </AuditReportSection>
  )
}

export { ScoreBreakdownSection }
