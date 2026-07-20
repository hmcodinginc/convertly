import { Sparkles } from "lucide-react"
import { useMemo } from "react"

import {
  RecommendationCard,
  RecommendationCardGrid,
} from "@/components/dashboard/RecommendationCard"
import { EmptyState } from "@/components/feedback/EmptyState"
import { RecommendationPlaybookDrawer } from "@/features/audits/components/RecommendationPlaybookDrawer"
import { useRecommendationPlaybook } from "@/features/audits/hooks/useRecommendationPlaybook"
import { AuditReportSection } from "@/features/audits/components/AuditReportSection"
import { FEATURED_COUNT } from "@/features/audits/sections/AuditTopPrioritySection"
import { groupRecommendations } from "@/features/audits/utils/groupAuditPresentation"
import type { PageFinding, Recommendation } from "@/types/audit"

type AuditRecommendationsSectionProps = {
  recommendations: Recommendation[]
  pages: PageFinding[]
  domain?: string
}

function AuditRecommendationsSection({
  recommendations,
  pages,
  domain,
}: AuditRecommendationsSectionProps) {
  const grouped = useMemo(
    () => groupRecommendations(recommendations, pages),
    [recommendations, pages]
  )
  const additional = grouped.slice(FEATURED_COUNT)
  const { activePlaybook, loadingPlaybookId, openPlaybook, closePlaybook } =
    useRecommendationPlaybook()

  if (recommendations.length === 0) {
    return (
      <AuditReportSection
        id="recommendations"
        eyebrow="AI insights"
        title="AI recommendations"
        description="Consolidated recommendations across affected pages. Open a playbook for implementation guidance."
      >
        <EmptyState
          icon={Sparkles}
          title="No recommendations yet"
          description="Recommendations will appear when analysis completes."
        />
      </AuditReportSection>
    )
  }

  if (additional.length === 0) {
    return null
  }

  return (
    <>
      <AuditReportSection
        id="recommendations"
        eyebrow="AI insights"
        title="Additional recommendations"
        description="Further improvements beyond the top priority fixes. Each includes an implementation playbook."
      >
        <RecommendationCardGrid>
          {additional.map((rec) => {
            const playbookId = rec.recommendationIds[0]!
            const pageCount = rec.affectedCount
            const evidenceCount = rec.evidenceCount ?? pageCount
            const summary =
              evidenceCount > 1
                ? `${evidenceCount} findings across ${pageCount || evidenceCount} page${(pageCount || evidenceCount) === 1 ? "" : "s"}. ${rec.summary}`
                : rec.summary

            const recommendation: Recommendation = {
              id: playbookId,
              ruleId: rec.ruleId,
              title: rec.title,
              summary: rec.summary,
              priority: rec.priority,
              estimatedLift: rec.estimatedLift,
              category: rec.category,
              affectedPages: rec.affectedPages,
              affectedCount: rec.affectedCount,
              evidenceCount: rec.evidenceCount,
            }

            const scrollContent =
              rec.pageLabels.length > 0 ? (
                <div className="rec-card__pages">
                  <p className="rec-card__pages-label">Affected pages</p>
                  <ul className="rec-card__page-list">
                    {rec.pageLabels.map((label, index) => (
                      <li key={`${label}-${rec.affectedPages[index] ?? index}`}>
                        <span className="rec-card__page-label">{label}</span>
                        {rec.affectedPages[index] ? (
                          <code className="rec-card__page-path">
                            {rec.affectedPages[index]}
                          </code>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null

            return (
              <RecommendationCard
                key={rec.key}
                category={rec.category}
                priority={rec.priority}
                title={rec.title}
                description={summary}
                estimatedLift={rec.estimatedLift}
                loadingPlaybook={loadingPlaybookId === playbookId}
                onViewPlaybook={() => void openPlaybook(recommendation)}
                scrollContent={scrollContent}
              />
            )
          })}
        </RecommendationCardGrid>
      </AuditReportSection>

      <RecommendationPlaybookDrawer
        open={Boolean(activePlaybook)}
        onClose={closePlaybook}
        recommendation={activePlaybook?.recommendation ?? null}
        playbook={activePlaybook?.playbook ?? null}
        domain={domain}
      />
    </>
  )
}

export { AuditRecommendationsSection }
