import { ArrowLeft } from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { PageError, PageLoading } from "@/components/feedback/PageState"
import { Button } from "@/components/ui/button"
import { AppPageHeader } from "@/components/layout/AppPageHeader"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { Text } from "@/components/ui/typography/Text"
import { AuditMetadataSection } from "@/features/audits/sections/AuditMetadataSection"
import { AuditRecommendationsSection } from "@/features/audits/sections/AuditRecommendationsSection"
import { AuditSummarySection } from "@/features/audits/sections/AuditSummarySection"
import { AuditTimelineSection } from "@/features/audits/sections/AuditTimelineSection"
import { PageFindingsSection } from "@/features/audits/sections/PageFindingsSection"
import { PrioritizedIssuesSection } from "@/features/audits/sections/PrioritizedIssuesSection"
import { ScoreBreakdownSection } from "@/features/audits/sections/ScoreBreakdownSection"
import { useAsyncData } from "@/hooks/useAsyncData"
import { ROUTES } from "@/lib/routes"
import * as auditService from "@/services/auditService"
import type { AuditDetail } from "@/types/audit"

const auditStatusVariant = {
  Completed: "success",
  Running: "accent",
  Scheduled: "neutral",
} as const

function AuditDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: audit, isLoading, isError, error, reload } = useAsyncData(
    () => {
      if (!id) return Promise.resolve(null)
      return auditService.getAuditDetail(id)
    },
    [id]
  )

  if (!id) {
    return (
      <AppPageShell
        header={
          <AppPageHeader
            title="Audit not found"
            description="This audit does not exist or may have been removed."
          />
        }
      >
        <Button variant="outline" size="sm" asChild>
          <Link to={ROUTES.audits}>Back to audit history</Link>
        </Button>
      </AppPageShell>
    )
  }

  if (isLoading) {
    return (
      <AppPageShell header={<PageLoading label="Loading audit report…" />}>
        <PageLoading label="Loading audit report…" />
      </AppPageShell>
    )
  }

  if (isError) {
    return (
      <AppPageShell
        header={
          <AppPageHeader
            title="Audit report"
            description="Conversion audit details"
          />
        }
      >
        <PageError description={error ?? undefined} onRetry={reload} />
      </AppPageShell>
    )
  }

  if (!audit) {
    return (
      <AppPageShell
        header={
          <AppPageHeader
            title="Audit not found"
            description="This audit does not exist or may have been removed."
          />
        }
      >
        <Button variant="outline" size="sm" asChild>
          <Link to={ROUTES.audits}>Back to audit history</Link>
        </Button>
      </AppPageShell>
    )
  }

  return <AuditDetailContent audit={audit} />
}

function AuditDetailContent({ audit }: { audit: AuditDetail }) {
  return (
    <AppPageShell
      header={
        <>
          <Button variant="ghost" size="sm" className="mb-6 h-8 px-2 text-foreground/70" asChild>
            <Link to={ROUTES.audits}>
              <ArrowLeft className="size-4" aria-hidden />
              Audit history
            </Link>
          </Button>

          <header className="border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Text
                    variant="muted"
                    size="sm"
                    className="max-w-none font-medium tracking-[0.16em] uppercase"
                  >
                    Audit report
                  </Text>
                  <StatusBadge
                    label={audit.status}
                    variant={auditStatusVariant[audit.status]}
                  />
                </div>
                <AppPageHeader
                  title={audit.name}
                  description={`${audit.domain} · ${audit.completedAt} · ${audit.pagesAnalyzed} pages analyzed`}
                  className="border-0 pb-0"
                />
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-4xl font-medium tabular-nums tracking-tight text-foreground">
                    {audit.overallScore}
                  </p>
                  <Text variant="muted" size="sm" className="mt-1 max-w-none">
                    Conversion score
                  </Text>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={ROUTES.auditNew}>Run again</Link>
                </Button>
              </div>
            </div>
            <div className="mt-4 sm:hidden">
              <p className="text-4xl font-medium tabular-nums tracking-tight text-foreground">
                {audit.overallScore}
              </p>
              <Text variant="muted" size="sm" className="mt-1 max-w-none">
                Conversion score
              </Text>
            </div>
          </header>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_17rem] xl:items-start">
        <AuditSummarySection audit={audit} />
        <AuditTimelineSection events={audit.timeline} compact />
      </div>

      <ScoreBreakdownSection categories={audit.scoreBreakdown} />
      <PageFindingsSection pages={audit.pageFindings} />
      <PrioritizedIssuesSection issues={audit.issues} />
      <AuditRecommendationsSection recommendations={audit.recommendations} />
      <AuditMetadataSection audit={audit} />

      {audit.status === "Running" ? (
        <Text
          variant="muted"
          size="sm"
          className="max-w-none border-t border-[color-mix(in_srgb,var(--border)_55%,transparent)] pt-6"
        >
          This audit is still in progress. Scores and recommendations will update when the
          scan completes.
        </Text>
      ) : null}
    </AppPageShell>
  )
}

export default AuditDetailPage
