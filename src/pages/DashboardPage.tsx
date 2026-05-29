import { Link } from "react-router-dom"

import { OnboardingCard } from "@/components/feedback/OnboardingCard"
import { PageError, PageLoading } from "@/components/feedback/PageState"
import { Button } from "@/components/ui/button"
import { AppPageHeader } from "@/components/layout/AppPageHeader"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { AiRecommendationsSection } from "@/features/dashboard/sections/AiRecommendationsSection"
import { MetricsOverviewSection } from "@/features/dashboard/sections/MetricsOverviewSection"
import { OpportunityQueueSection } from "@/features/dashboard/sections/OpportunityQueueSection"
import { RecentAuditsSection } from "@/features/dashboard/sections/RecentAuditsSection"
import { useAsyncData } from "@/hooks/useAsyncData"
import { ROUTES } from "@/lib/routes"
import * as auditService from "@/services/auditService"
import type { Audit, Recommendation } from "@/types/audit"
import type { DashboardMetric, OpportunityItem } from "@/types/dashboard"

type DashboardData = {
  metrics: DashboardMetric[]
  opportunities: OpportunityItem[]
  recommendations: Recommendation[]
  audits: Audit[]
  showOnboarding: boolean
}

async function loadDashboard(): Promise<DashboardData> {
  const [metrics, opportunities, recommendations, audits, hasUser] = await Promise.all([
    auditService.getDashboardMetrics(),
    auditService.getOpportunityQueue(),
    auditService.getDashboardRecommendations(),
    auditService.getAudits(),
    auditService.hasUserAudits(),
  ])

  return {
    metrics,
    opportunities,
    recommendations,
    audits,
    showOnboarding: !hasUser,
  }
}

function DashboardPage() {
  const { data, isLoading, isError, error, reload } = useAsyncData(loadDashboard, [])

  const header = (
    <AppPageHeader
      eyebrow="Workspace"
      title="Audit dashboard"
      description="Monitor conversion health, prioritize fixes, and track audit outcomes across your funnel."
      actions={
        <Button size="sm" asChild>
          <Link to={ROUTES.auditNew}>Run new audit</Link>
        </Button>
      }
    />
  )

  if (isLoading) {
    return (
      <AppPageShell header={header}>
        <PageLoading label="Loading dashboard…" />
      </AppPageShell>
    )
  }

  if (isError || !data) {
    return (
      <AppPageShell header={header}>
        <PageError description={error ?? undefined} onRetry={reload} />
      </AppPageShell>
    )
  }

  return (
    <AppPageShell header={header}>
      {data.showOnboarding ? <OnboardingCard /> : null}
      <MetricsOverviewSection metrics={data.metrics} />
      <OpportunityQueueSection items={data.opportunities} />
      <AiRecommendationsSection recommendations={data.recommendations} />
      <RecentAuditsSection audits={data.audits} />
    </AppPageShell>
  )
}

export default DashboardPage
