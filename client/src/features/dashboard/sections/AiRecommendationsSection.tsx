import { RecommendationCards } from "@/components/dashboard/RecommendationCards"
import { AppPageSection } from "@/components/layout/AppPageSection"
import { ROUTES } from "@/lib/routes"
import type { Recommendation } from "@/types/audit"

type AiRecommendationsSectionProps = {
  recommendations: Recommendation[]
  auditDomain?: string
}

function AiRecommendationsSection({
  recommendations,
  auditDomain,
}: AiRecommendationsSectionProps) {
  return (
    <AppPageSection
      className="dashboard-ai-recommendations"
      eyebrow="AI insights"
      title="AI recommendations"
      description={
        auditDomain
          ? `Recommendations generated for ${auditDomain}`
          : "Actionable experiments generated from your latest audit signals."
      }
    >
      <RecommendationCards
        className="dashboard-recommendation-grid"
        recommendations={recommendations}
        emptyActionTo={ROUTES.auditNew}
      />
    </AppPageSection>
  )
}

export { AiRecommendationsSection }
