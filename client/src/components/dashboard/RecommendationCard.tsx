import { Sparkles } from "lucide-react"
import type { ReactNode } from "react"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { Card } from "@/components/surfaces/Card"
import type { RecommendationPriority } from "@/types/audit"
import { cn } from "@/lib/utils"

import "./recommendation-card.css"

const priorityVariant = {
  Critical: "danger",
  High: "warning",
  Medium: "neutral",
} as const

type RecommendationCardProps = {
  category: string
  priority: RecommendationPriority
  title: string
  description: string
  estimatedLift: string
  loadingPlaybook?: boolean
  onViewPlaybook?: () => void
  scrollContent?: ReactNode
  className?: string
}

function RecommendationCard({
  category,
  priority,
  title,
  description,
  estimatedLift,
  loadingPlaybook = false,
  onViewPlaybook,
  scrollContent,
  className,
}: RecommendationCardProps) {
  return (
    <Card className={cn("rec-card app-card-metric p-0 hover:translate-y-0", className)}>
      <header className="rec-card__header">
        <span className="rec-card__category">
          <Sparkles className="rec-card__category-icon size-3.5" aria-hidden />
          {category}
        </span>
        <StatusBadge label={priority} variant={priorityVariant[priority]} />
      </header>

      <div className="rec-card__recommendation">
        <h3 className="rec-card__title">{title}</h3>
        <p className="rec-card__description">{description}</p>
      </div>

      {scrollContent ? (
        <div className="rec-card__scroll" tabIndex={0}>
          <div className="rec-card__scroll-inner">{scrollContent}</div>
        </div>
      ) : null}

      <footer className="rec-card__footer">
        <p className="rec-card__impact">{estimatedLift}</p>
        <button
          type="button"
          disabled={!onViewPlaybook || loadingPlaybook}
          onClick={onViewPlaybook}
          className="rec-card__playbook"
        >
          {loadingPlaybook ? "Loading…" : "View playbook →"}
        </button>
      </footer>
    </Card>
  )
}

function RecommendationCardGrid({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={cn("rec-card-grid", className)}>{children}</div>
}

export { RecommendationCard, RecommendationCardGrid }
