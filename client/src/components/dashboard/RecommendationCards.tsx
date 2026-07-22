import { Sparkles } from "lucide-react"

import {
  RecommendationCard,
  RecommendationCardGrid,
} from "@/components/dashboard/RecommendationCard"
import { EmptyState } from "@/components/feedback/EmptyState"
import { ROUTES } from "@/lib/routes"
import type { Recommendation } from "@/types/audit"
import { cn } from "@/lib/utils"

type RecommendationCardsProps = {
  recommendations: Recommendation[]
  emptyActionTo?: string
  className?: string
  loadingPlaybookId?: string | null
  onViewPlaybook?: (recommendation: Recommendation) => void
}

function RecommendationCards({
  recommendations,
  emptyActionTo = ROUTES.auditNew,
  className,
  loadingPlaybookId = null,
  onViewPlaybook,
}: RecommendationCardsProps) {
  if (recommendations.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No recommendations yet"
        description="Run an audit to generate prioritized conversion recommendations for your funnel."
        action={{ label: "Run audit", to: emptyActionTo }}
      />
    )
  }

  return (
    <RecommendationCardGrid className={cn(className)}>
      {recommendations.map((rec) => (
        <RecommendationCard
          key={rec.id}
          category={rec.category}
          priority={rec.priority}
          title={rec.title}
          description={rec.summary}
          estimatedLift={rec.estimatedLift}
          loadingPlaybook={loadingPlaybookId === rec.id}
          onViewPlaybook={onViewPlaybook ? () => onViewPlaybook(rec) : undefined}
        />
      ))}
    </RecommendationCardGrid>
  )
}

export { RecommendationCards }
