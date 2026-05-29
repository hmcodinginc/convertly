import { Sparkles } from "lucide-react"
import { useState } from "react"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { Drawer } from "@/components/feedback/Drawer"
import { EmptyState } from "@/components/feedback/EmptyState"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { AuditReportSection } from "@/features/audits/components/AuditReportSection"
import * as auditService from "@/services/auditService"
import type { Recommendation, RecommendationPlaybook } from "@/types/audit"

const priorityVariant = {
  Critical: "danger",
  High: "warning",
  Medium: "neutral",
} as const

type AuditRecommendationsSectionProps = {
  recommendations: Recommendation[]
}

function PlaybookDrawerContent({ playbook }: { playbook: RecommendationPlaybook }) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Text
          variant="muted"
          size="sm"
          className="max-w-none text-xs font-medium tracking-[0.14em] uppercase"
        >
          Problem
        </Text>
        <Text size="sm" className="max-w-none leading-7">
          {playbook.problem}
        </Text>
      </div>
      <div className="space-y-2">
        <Text
          variant="muted"
          size="sm"
          className="max-w-none text-xs font-medium tracking-[0.14em] uppercase"
        >
          Why it matters
        </Text>
        <Text size="sm" className="max-w-none leading-7">
          {playbook.whyItMatters}
        </Text>
      </div>
      <div className="space-y-2">
        <Text
          variant="muted"
          size="sm"
          className="max-w-none text-xs font-medium tracking-[0.14em] uppercase"
        >
          Recommendation
        </Text>
        <Text size="sm" className="max-w-none leading-7">
          {playbook.recommendation}
        </Text>
      </div>
      <div className="rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_65%,transparent)] bg-[color-mix(in_srgb,var(--surface)_50%,transparent)] px-4 py-3">
        <Text variant="muted" size="sm" className="max-w-none text-xs font-medium uppercase">
          Estimated lift
        </Text>
        <Text size="sm" className="mt-1 max-w-none font-medium text-[#86efac]">
          {playbook.estimatedLift}
        </Text>
      </div>
      <div className="space-y-3">
        <Text
          variant="muted"
          size="sm"
          className="max-w-none text-xs font-medium tracking-[0.14em] uppercase"
        >
          Implementation steps
        </Text>
        <ol className="space-y-3">
          {playbook.implementationSteps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-6 text-foreground/90">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--border)_75%,transparent)] text-xs font-medium text-muted">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function AuditRecommendationsSection({
  recommendations,
}: AuditRecommendationsSectionProps) {
  const [activePlaybook, setActivePlaybook] = useState<{
    rec: Recommendation
    playbook: RecommendationPlaybook
  } | null>(null)
  const [loadingPlaybookId, setLoadingPlaybookId] = useState<string | null>(null)

  const openPlaybook = async (rec: Recommendation) => {
    setLoadingPlaybookId(rec.id)
    try {
      const playbook = await auditService.getRecommendationPlaybook(rec.id)
      setActivePlaybook({ rec, playbook })
    } finally {
      setLoadingPlaybookId(null)
    }
  }

  return (
    <>
      <AuditReportSection
        eyebrow="AI insights"
        title="AI recommendations"
        description="Prioritized experiments based on this audit's findings. Open a playbook for implementation guidance."
      >
        {recommendations.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No recommendations yet"
            description="Recommendations will appear when analysis completes."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {recommendations.map((rec) => (
              <Card key={rec.id} className="app-card-metric flex h-full flex-col hover:translate-y-0">
                <div className="flex flex-1 flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-foreground/70 uppercase">
                      <Sparkles
                        className="size-3.5 text-[color-mix(in_srgb,var(--accent)_80%,white)]"
                        aria-hidden
                      />
                      {rec.category}
                    </span>
                    <StatusBadge
                      label={rec.priority}
                      variant={priorityVariant[rec.priority]}
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {rec.title}
                    </h3>
                    <Text variant="muted" size="sm" className="max-w-none leading-6">
                      {rec.summary}
                    </Text>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-[color-mix(in_srgb,var(--border)_55%,transparent)] pt-4">
                    <Text size="sm" className="max-w-none font-medium text-[#86efac]">
                      {rec.estimatedLift}
                    </Text>
                    <button
                      type="button"
                      disabled={loadingPlaybookId === rec.id}
                      onClick={() => void openPlaybook(rec)}
                      className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground disabled:opacity-50"
                    >
                      {loadingPlaybookId === rec.id ? "Loading…" : "View playbook →"}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </AuditReportSection>

      <Drawer
        open={Boolean(activePlaybook)}
        onClose={() => setActivePlaybook(null)}
        title={activePlaybook?.rec.title ?? "Playbook"}
        description={activePlaybook?.rec.category}
      >
        {activePlaybook ? (
          <PlaybookDrawerContent playbook={activePlaybook.playbook} />
        ) : null}
      </Drawer>
    </>
  )
}

export { AuditRecommendationsSection }
