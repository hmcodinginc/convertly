import { Link } from "react-router-dom"
import { useMemo, useState } from "react"

import { OnboardingCard } from "@/components/feedback/OnboardingCard"
import { PageError, PageLoading } from "@/components/feedback/PageState"
import { Button } from "@/components/ui/button"
import { AppPageHeader } from "@/components/layout/AppPageHeader"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { CurrentAuditSelector } from "@/features/dashboard/components/CurrentAuditSelector"
import { AiRecommendationsSection } from "@/features/dashboard/sections/AiRecommendationsSection"
import { MetricsOverviewSection } from "@/features/dashboard/sections/MetricsOverviewSection"
import { OpportunityQueueSection } from "@/features/dashboard/sections/OpportunityQueueSection"
import { RecentAuditsSection } from "@/features/dashboard/sections/RecentAuditsSection"
import { DeleteAuditModal } from "@/features/audits/components/DeleteAuditModal"
import {
  buildOpportunitiesFromAuditDetail,
  buildRecommendationsFromAuditDetail,
  getDefaultSelectedAuditId,
  mergeMetricsForSelectedAudit,
  sortAuditsNewestFirst,
} from "@/features/dashboard/utils/auditDashboardView"
import { useAsyncData } from "@/hooks/useAsyncData"
import { ROUTES } from "@/lib/routes"
import * as auditService from "@/services/auditService"
import type { Audit, Recommendation } from "@/types/audit"
import type { DashboardMetric, OpportunityItem } from "@/types/dashboard"

type DashboardData = {
  metrics: DashboardMetric[]
  audits: Audit[]
  showOnboarding: boolean
}

async function loadDashboard(): Promise<DashboardData> {
  const bundle = await auditService.getDashboardData()

  return {
    metrics: bundle.metrics,
    audits: sortAuditsNewestFirst(bundle.audits),
    showOnboarding: bundle.showOnboarding,
  }
}

function DashboardPage() {
  const { data, isLoading, isError, error, reload } = useAsyncData(loadDashboard, [])
  const [userSelectedAuditId, setUserSelectedAuditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Audit | null>(null)

  const selectedAuditId = useMemo(() => {
    if (!data || data.audits.length === 0) return null

    if (
      userSelectedAuditId &&
      data.audits.some((audit) => audit.id === userSelectedAuditId)
    ) {
      return userSelectedAuditId
    }

    return getDefaultSelectedAuditId(data.audits)
  }, [data, userSelectedAuditId])

  const {
    data: selectedDetail,
    isLoading: detailLoading,
  } = useAsyncData(
    () =>
      selectedAuditId
        ? auditService.getAuditDetail(selectedAuditId)
        : Promise.resolve(null),
    [selectedAuditId],
    { enabled: Boolean(selectedAuditId) }
  )

  const selectedAudit = useMemo(
    () => data?.audits.find((audit) => audit.id === selectedAuditId) ?? null,
    [data?.audits, selectedAuditId]
  )

  const metrics = useMemo(
    () => (data ? mergeMetricsForSelectedAudit(data.metrics, selectedDetail) : []),
    [data, selectedDetail]
  )

  const opportunities: OpportunityItem[] = useMemo(
    () => (selectedDetail ? buildOpportunitiesFromAuditDetail(selectedDetail) : []),
    [selectedDetail]
  )

  const recommendations: Recommendation[] = useMemo(
    () => (selectedDetail ? buildRecommendationsFromAuditDetail(selectedDetail) : []),
    [selectedDetail]
  )

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

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await auditService.deleteAudit(deleteTarget.id)
    setDeleteTarget(null)
    if (userSelectedAuditId === deleteTarget.id) {
      setUserSelectedAuditId(null)
    }
    reload()
  }

  return (
    <AppPageShell header={header}>
      {data.showOnboarding ? <OnboardingCard /> : null}

      {data.audits.length > 0 ? (
        <CurrentAuditSelector
          audits={data.audits}
          selectedAuditId={selectedAuditId}
          onSelect={setUserSelectedAuditId}
        />
      ) : null}

      <MetricsOverviewSection metrics={metrics} />

      {detailLoading && selectedAuditId ? (
        <PageLoading label="Loading audit insights…" />
      ) : (
        <>
          <OpportunityQueueSection
            items={opportunities}
            auditDomain={selectedAudit?.domain}
            auditId={selectedAuditId}
          />
          <AiRecommendationsSection
            recommendations={recommendations}
            auditDomain={selectedAudit?.domain}
          />
        </>
      )}

      <RecentAuditsSection audits={data.audits} onDeleteRequest={setDeleteTarget} />

      <DeleteAuditModal
        audit={deleteTarget}
        open={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        onConfirmDelete={handleConfirmDelete}
      />
    </AppPageShell>
  )
}

export default DashboardPage
