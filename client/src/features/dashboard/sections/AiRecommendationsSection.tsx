import { RecommendationCards } from "@/components/dashboard/RecommendationCards"
import { AppPageSection } from "@/components/layout/AppPageSection"
import { RecommendationPlaybookDrawer } from "@/features/audits/components/RecommendationPlaybookDrawer"
import { useRecommendationPlaybook } from "@/features/audits/hooks/useRecommendationPlaybook"
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
  const { activePlaybook, loadingPlaybookId, openPlaybook, closePlaybook } =
    useRecommendationPlaybook()

  return (
    <>
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
          loadingPlaybookId={loadingPlaybookId}
          onViewPlaybook={(rec) => void openPlaybook(rec)}
        />
      </AppPageSection>

      <RecommendationPlaybookDrawer
        open={Boolean(activePlaybook)}
        onClose={closePlaybook}
        recommendation={activePlaybook?.recommendation ?? null}
        playbook={activePlaybook?.playbook ?? null}
        domain={auditDomain}
      />
    </>
  )
}

export { AiRecommendationsSection }
