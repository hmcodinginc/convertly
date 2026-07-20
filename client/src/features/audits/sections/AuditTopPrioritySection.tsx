import { ArrowRight, Sparkles } from "lucide-react"
import { useMemo } from "react"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { RecommendationPlaybookDrawer } from "@/features/audits/components/RecommendationPlaybookDrawer"
import { useRecommendationPlaybook } from "@/features/audits/hooks/useRecommendationPlaybook"
import { AuditReportSection } from "@/features/audits/components/AuditReportSection"
import { groupRecommendations } from "@/features/audits/utils/groupAuditPresentation"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import type { PageFinding, Recommendation } from "@/types/audit"

const priorityVariant = {
  Critical: "danger",
  High: "warning",
  Medium: "neutral",
} as const

const FEATURED_COUNT = 3

type AuditTopPrioritySectionProps = {
  recommendations: Recommendation[]
  pages: PageFinding[]
  domain?: string
}

function AuditTopPrioritySection({
  recommendations,
  pages,
  domain,
}: AuditTopPrioritySectionProps) {
  const grouped = useMemo(
    () => groupRecommendations(recommendations, pages),
    [recommendations, pages]
  )
  const featured = grouped.slice(0, FEATURED_COUNT)
  const { activePlaybook, loadingPlaybookId, openPlaybook, closePlaybook } =
    useRecommendationPlaybook()

  if (featured.length === 0) return null

  return (
    <>
      <AuditReportSection
        id="priorities"
        eyebrow="Action plan"
        title="Top priority fixes"
        description="Start here — the highest-impact changes identified across your audit, ranked by severity and estimated lift."
      >
        <ol className="audit-priority-list">
          {featured.map((rec, index) => {
            const playbookId = rec.recommendationIds[0]!
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

            return (
              <li key={rec.key}>
                <Card className="audit-priority-card app-card-metric hover:translate-y-0">
                  <div className="audit-priority-card__rank" aria-hidden>
                    {index + 1}
                  </div>
                  <div className="audit-priority-card__body">
                    <div className="audit-priority-card__header">
                      <span className="audit-priority-card__category">
                        <Sparkles className="size-3.5" aria-hidden />
                        {rec.category}
                      </span>
                      <StatusBadge
                        label={rec.priority}
                        variant={priorityVariant[rec.priority]}
                      />
                    </div>
                    <h3 className="audit-priority-card__title">{rec.title}</h3>
                    <p className="audit-priority-card__summary">{rec.summary}</p>
                    <div className="audit-priority-card__footer">
                      <p className="audit-priority-card__lift">{rec.estimatedLift}</p>
                      {rec.affectedCount > 0 ? (
                        <Text variant="muted" size="sm" className="audit-priority-card__scope max-w-none text-xs">
                          {rec.affectedCount} page{rec.affectedCount === 1 ? "" : "s"}
                          {rec.evidenceCount > 1 ? ` · ${rec.evidenceCount} findings` : ""}
                        </Text>
                      ) : null}
                      <button
                        type="button"
                        className="audit-priority-card__cta"
                        disabled={loadingPlaybookId === playbookId}
                        onClick={() => void openPlaybook(recommendation)}
                      >
                        {loadingPlaybookId === playbookId ? "Loading…" : "View playbook"}
                        <ArrowRight className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  </div>
                </Card>
              </li>
            )
          })}
        </ol>
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

export { AuditTopPrioritySection, FEATURED_COUNT }
