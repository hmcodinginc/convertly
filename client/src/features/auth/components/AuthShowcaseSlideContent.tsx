import { Sparkles } from "lucide-react"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { AuthShowcaseMetricCard } from "@/features/auth/components/AuthShowcaseMetricCard"
import {
  BeforeAfterBars,
  ConfidenceIndicator,
  EffortIndicator,
} from "@/features/auth/components/AuthShowcaseVisuals"
import type { AuthShowcaseSlideId } from "@/features/auth/content/authContent"
import { aiRecommendations, dashboardMetrics } from "@/features/dashboard/data/mockData"
import { cn } from "@/lib/utils"
import type { Recommendation } from "@/types/audit"

const priorityVariant = {
  Critical: "danger",
  High: "warning",
  Medium: "neutral",
} as const

const recommendationMeta: Record<
  string,
  {
    confidence: number
    effort: "Low" | "Medium" | "High"
    before: number
    after: number
    status: string
    statusVariant: "success" | "accent" | "warning"
  }
> = {
  "rec-1": {
    confidence: 92,
    effort: "Low",
    before: 64,
    after: 75,
    status: "Ready to ship",
    statusVariant: "success",
  },
  "rec-2": {
    confidence: 88,
    effort: "Medium",
    before: 58,
    after: 67,
    status: "In review",
    statusVariant: "accent",
  },
}

const workflowSteps = [
  { step: "01", label: "Website", detail: "Connect your URL" },
  { step: "02", label: "AI Analysis", detail: "Map friction & intent" },
  { step: "03", label: "Prioritized Actions", detail: "Rank by impact" },
  { step: "04", label: "Results", detail: "Track conversion lift" },
] as const

const teamBenefits = [
  {
    team: "Product",
    benefit: "Ship fixes with scored impact and clear implementation direction.",
    signal: "12 active fixes",
  },
  {
    team: "Marketing",
    benefit: "Align messaging and landing pages with live conversion signals.",
    signal: "8 page tests",
  },
  {
    team: "Growth",
    benefit: "Prioritize experiments from audit-backed opportunity queues.",
    signal: "23 opportunities",
  },
] as const

function AuthRecommendationMiniCard({ recommendation }: { recommendation: Recommendation }) {
  const meta = recommendationMeta[recommendation.id] ?? {
    confidence: 84,
    effort: "Medium" as const,
    before: 60,
    after: 68,
    status: "Queued",
    statusVariant: "warning" as const,
  }

  return (
    <div className="auth-showcase-tile flex h-full flex-col gap-3 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[0.68rem] font-medium tracking-wide text-foreground/70 uppercase">
            <Sparkles
              className="size-3 text-[color-mix(in_srgb,var(--accent)_80%,white)]"
              aria-hidden
            />
            {recommendation.category}
          </span>
          <StatusBadge
            label={recommendation.priority}
            variant={priorityVariant[recommendation.priority]}
          />
        </div>
        <StatusBadge label={meta.status} variant={meta.statusVariant} />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {recommendation.title}
        </h3>
        <Text variant="muted" size="sm" className="max-w-none text-xs leading-5">
          {recommendation.summary}
        </Text>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--border)_55%,transparent)] bg-[color-mix(in_srgb,var(--surface)_38%,transparent)] p-2">
          <Text variant="muted" size="sm" className="max-w-none text-[0.62rem] uppercase">
            Est. lift
          </Text>
          <Text size="sm" className="mt-1 max-w-none text-xs font-medium text-[#86efac]">
            {recommendation.estimatedLift}
          </Text>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--border)_55%,transparent)] bg-[color-mix(in_srgb,var(--surface)_38%,transparent)] p-2">
          <ConfidenceIndicator value={meta.confidence} />
        </div>
      </div>

      <BeforeAfterBars before={meta.before} after={meta.after} />
      <EffortIndicator level={meta.effort} />
    </div>
  )
}

type AuthShowcaseSlideContentProps = {
  slideId: AuthShowcaseSlideId
}

function AuthShowcaseSlideContent({ slideId }: AuthShowcaseSlideContentProps) {
  if (slideId === "overview") {
    return (
      <div className="grid h-full grid-cols-2 gap-3">
        {dashboardMetrics.map((metric) => (
          <AuthShowcaseMetricCard key={metric.id} metric={metric} compact />
        ))}
      </div>
    )
  }

  if (slideId === "audit-report") {
    const [scoreMetric, revenueMetric, opportunitiesMetric, pagesMetric] = dashboardMetrics

    return (
      <div className="grid h-full grid-cols-2 gap-3">
        <AuthShowcaseMetricCard metric={scoreMetric} compact />
        <AuthShowcaseMetricCard metric={revenueMetric} compact />
        <AuthShowcaseMetricCard metric={opportunitiesMetric} compact />
        <AuthShowcaseMetricCard metric={pagesMetric} compact />
      </div>
    )
  }

  if (slideId === "recommendations") {
    return (
      <div className="grid h-full grid-rows-2 gap-3">
        {aiRecommendations.slice(0, 2).map((recommendation) => (
          <AuthRecommendationMiniCard key={recommendation.id} recommendation={recommendation} />
        ))}
      </div>
    )
  }

  if (slideId === "workflow") {
    return (
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="relative grid grid-cols-4 gap-2">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-5 right-[12%] left-[12%] border-t border-[color-mix(in_srgb,var(--border)_78%,transparent)]"
          />
          {workflowSteps.map((step) => (
            <div key={step.label} className="relative space-y-2 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] text-[0.68rem] font-semibold tracking-[0.08em] text-foreground/88">
                {step.step}
              </div>
              <Text size="sm" className="max-w-none text-xs font-medium leading-4 text-foreground/88">
                {step.label}
              </Text>
              <Text variant="muted" size="sm" className="max-w-none text-[0.68rem] leading-4">
                {step.detail}
              </Text>
            </div>
          ))}
        </div>

        <div className="auth-showcase-tile">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Text variant="muted" size="sm" className="max-w-none text-xs uppercase">
                Latest run
              </Text>
              <Heading level={4} size="subsection" className="mt-1 text-base">
                Q2 Growth funnel
              </Heading>
            </div>
            <StatusBadge label="Completed" variant="success" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Score", value: "78" },
              { label: "Issues", value: "14" },
              { label: "Recs", value: "6" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--border)_55%,transparent)] bg-[color-mix(in_srgb,var(--surface)_38%,transparent)] px-2 py-2"
              >
                <Text variant="muted" size="sm" className="max-w-none text-[0.62rem] uppercase">
                  {item.label}
                </Text>
                <p className="mt-1 text-sm font-medium tabular-nums text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {teamBenefits.map((item) => (
        <div
          key={item.team}
          className={cn("auth-showcase-tile flex flex-1 flex-col justify-between p-3.5")}
        >
          <div>
            <Text
              size="sm"
              className="max-w-none text-xs font-medium tracking-[0.14em] uppercase text-foreground/55"
            >
              {item.team}
            </Text>
            <Text variant="muted" size="sm" className="mt-2 max-w-none text-xs leading-5">
              {item.benefit}
            </Text>
          </div>
          <Text size="sm" className="mt-3 max-w-none text-xs font-medium text-[#86efac]">
            {item.signal}
          </Text>
        </div>
      ))}
    </div>
  )
}

export { AuthShowcaseSlideContent }
