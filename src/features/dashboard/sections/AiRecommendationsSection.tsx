import { RecommendationCards } from "@/components/dashboard/RecommendationCards"
import { AppPageSection } from "@/components/layout/AppPageSection"
import { ROUTES } from "@/lib/routes"
import type { Recommendation } from "@/types/audit"

type AiRecommendationsSectionProps = {
  recommendations: Recommendation[]
}

function AiRecommendationsSection({ recommendations }: AiRecommendationsSectionProps) {
  return (
    <AppPageSection
      eyebrow="AI insights"
      title="AI recommendations"
      description="Actionable experiments generated from your latest audit signals."
    >
      <RecommendationCards
        recommendations={recommendations}
        emptyActionTo={ROUTES.auditNew}
      />
    </AppPageSection>
  )
}

export { AiRecommendationsSection }
