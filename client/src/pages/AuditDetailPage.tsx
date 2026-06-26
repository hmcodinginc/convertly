import { useCallback, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { AuditRunningExperience } from "@/components/audit/AuditRunningExperience"
import { AuditStatusBadge } from "@/components/audit/AuditStatusBadge"
import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
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
import { SiteWideFindingsSection } from "@/features/audits/sections/SiteWideFindingsSection"
import { ScoreBreakdownSection } from "@/features/audits/sections/ScoreBreakdownSection"
import {
  resetNetworkTrace,
  setNetworkTraceRoute,
} from "@/diagnostics/networkTrace"
import { useAsyncData } from "@/hooks/useAsyncData"
import { isAuditInProgress, isAuditSessionStatus } from "@/lib/auditStatus"
import { ROUTES } from "@/lib/routes"
import * as auditService from "@/services/auditService"
import type { AuditDetail, AuditStatus } from "@/types/audit"
import type { AuditSessionStatus } from "@/types/auditEngine"

const IN_PROGRESS_POLL_MS = 2_500

function toSessionStatus(status: AuditStatus): AuditSessionStatus {
  if (isAuditSessionStatus(status)) return status
  if (status === "Running") return "analyzing"
  return "pending"
}

function AuditDetailPage() {
  const { id } = useParams<{ id: string }>()

  const loadAudit = useCallback(() => {
    if (!id) return Promise.resolve(null)
    return auditService.getAuditDetail(id)
  }, [id])

  const { data: audit, isLoading, isError, error, reload } = useAsyncData(loadAudit, [id])

  const inProgress = audit ? isAuditInProgress(audit.status) : false

  useEffect(() => {
    if (import.meta.env.VITE_NETWORK_TRACE === "true" && id) {
      resetNetworkTrace()
      setNetworkTraceRoute(`/audits/${id}`)
    }
  }, [id])

  useEffect(() => {
    if (!id || !inProgress) return

    const interval = window.setInterval(() => {
      void reload({ silent: true })
    }, IN_PROGRESS_POLL_MS)

    return () => window.clearInterval(interval)
  }, [id, inProgress, reload])

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

  if (isLoading && !audit) {
    return (
      <AppPageShell header={<PageLoading label="Loading audit report…" />}>
        <div className="min-h-[12rem]" aria-hidden />
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
        <PageError
          description={error ?? undefined}
          onRetry={() => {
            auditService.invalidateCompletedAuditDetail(id)
            reload()
          }}
        />
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
  const running = isAuditInProgress(audit.status)
  const failed = audit.status === "failed"
  const headerDate = audit.completedAtDate ?? audit.createdAt ?? audit.completedAt

  return (
    <AppPageShell sectionsClassName="audit-report-sections" header={null}>
      <div className="audit-report-page">
        <nav className="audit-report-breadcrumb" aria-label="Audit navigation">
          <Button
            variant="ghost"
            size="sm"
            className="audit-report-breadcrumb__link"
            asChild
          >
            <Link to={ROUTES.audits}>
              <ArrowLeft className="size-4" aria-hidden />
              Audit history
            </Link>
          </Button>
        </nav>

        <header className="audit-report-hero">
          <div className="audit-report-hero__content">
            <div className="audit-report-hero__eyebrow">
              <Text
                variant="muted"
                size="sm"
                className="max-w-none font-medium tracking-[0.18em] uppercase"
              >
                Audit report
              </Text>
              <AuditStatusBadge status={audit.status} />
            </div>
            <h1 className="audit-report-hero__title">{audit.name}</h1>
            <p className="audit-report-hero__meta">
              <span>{audit.websiteUrl ?? audit.domain}</span>
              <span aria-hidden>·</span>
              <span>{headerDate}</span>
              <span aria-hidden>·</span>
              <span>{audit.pagesAnalyzed} pages analyzed</span>
            </p>
          </div>

          <div className="audit-report-hero__aside">
            <div
              className="audit-report-score-panel"
              aria-label={`Growth score ${audit.overallScore}`}
            >
              <p className="audit-report-score-panel__value">{audit.overallScore}</p>
              <p className="audit-report-score-panel__label">Growth Score</p>
              <p className="audit-report-score-panel__hint">Weighted conversion health</p>
            </div>
            <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
              <Link to={ROUTES.auditNew}>Run again</Link>
            </Button>
          </div>
        </header>

        {failed && audit.errorMessage ? (
          <AuthFormMessage className="audit-report-alert">{audit.errorMessage}</AuthFormMessage>
        ) : null}

        {running ? <AuditRunningExperience status={toSessionStatus(audit.status)} /> : null}

        <div className="audit-report-layout">
          <div className="audit-report-layout__main">
            <AuditSummarySection audit={audit} />
            <ScoreBreakdownSection
              categories={audit.scoreBreakdown}
              auditStatus={audit.status}
            />
            <PageFindingsSection pages={audit.pageFindings} auditStatus={audit.status} />
            <SiteWideFindingsSection findings={audit.siteFindings} auditStatus={audit.status} />
            <PrioritizedIssuesSection issues={audit.issues} auditStatus={audit.status} />
            <AuditRecommendationsSection recommendations={audit.recommendations} />
            <AuditMetadataSection audit={audit} />
          </div>

          <aside className="audit-report-layout__rail" aria-label="Audit timeline">
            <AuditTimelineSection events={audit.timeline} compact />
          </aside>
        </div>

        {running ? (
          <Text variant="muted" size="sm" className="audit-report-progress-note">
            This audit is still in progress. Scores and recommendations will update when the
            scan completes.
          </Text>
        ) : null}
      </div>
    </AppPageShell>
  )
}

export default AuditDetailPage
