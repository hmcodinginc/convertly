import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { AuditExecutionView } from "@/components/audit/execution/AuditExecutionView"
import { AuditStatusBadge } from "@/components/audit/AuditStatusBadge"
import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { PageError, PageLoading } from "@/components/feedback/PageState"
import { Button } from "@/components/ui/button"
import { AppPageHeader } from "@/components/layout/AppPageHeader"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { Text } from "@/components/ui/typography/Text"
import { AuditMetadataSection } from "@/features/audits/sections/AuditMetadataSection"
import { AuditReportActions } from "@/features/audits/components/AuditReportActions"
import { AuditRecommendationsSection } from "@/features/audits/sections/AuditRecommendationsSection"
import { AuditSummarySection } from "@/features/audits/sections/AuditSummarySection"
import { AuditScoreExplanationSection } from "@/features/audits/sections/AuditScoreExplanationSection"
import { AuditTimelineSection } from "@/features/audits/sections/AuditTimelineSection"
import { PageFindingsSection } from "@/features/audits/sections/PageFindingsSection"
import { PrioritizedIssuesSection } from "@/features/audits/sections/PrioritizedIssuesSection"
import { SiteWideFindingsSection } from "@/features/audits/sections/SiteWideFindingsSection"
import { ScoreBreakdownSection } from "@/features/audits/sections/ScoreBreakdownSection"
import { useAsyncData } from "@/hooks/useAsyncData"
import { useVertlyPageContext } from "@/features/vertly/hooks/useVertly"
import { isAuditInProgress } from "@/lib/auditStatus"
import { ROUTES } from "@/lib/routes"
import * as auditService from "@/services/auditService"
import type { AuditDetail } from "@/types/audit"

const IN_PROGRESS_POLL_MS = 2_500

function AuditDetailPage() {
  const { id } = useParams<{ id: string }>()

  const loadAudit = useCallback(() => {
    if (!id) return Promise.resolve(null)
    return auditService.getAuditDetail(id)
  }, [id])

  const { data: audit, isLoading, isError, error, reload } = useAsyncData(loadAudit, [id])

  const inProgress = audit ? isAuditInProgress(audit.status) : false

  const vertlyContext = useMemo(
    () =>
      audit
        ? {
            surface: "audit-detail" as const,
            title: audit.domain,
            description: `Reviewing ${audit.domain}`,
            metadata: {
              auditId: audit.id,
              domain: audit.domain,
              score: audit.overallScore,
              status: audit.status,
            },
          }
        : null,
    [audit]
  )

  useVertlyPageContext(vertlyContext)

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

  return <AuditDetailContent audit={audit} onReload={reload} />
}

function AuditDetailContent({
  audit,
  onReload,
}: {
  audit: AuditDetail
  onReload: (options?: { silent?: boolean }) => void
}) {
  const navigate = useNavigate()
  const running = isAuditInProgress(audit.status)
  const [showExecution, setShowExecution] = useState(running)

  useEffect(() => {
    if (running) {
      setShowExecution(true)
    }
  }, [running, audit.id])

  if (running && showExecution) {
    return (
      <AppPageShell header={null} sectionsClassName="gap-0">
        <AuditExecutionView
          auditId={audit.id}
          onComplete={() => {
            setShowExecution(false)
            auditService.invalidateCompletedAuditDetail(audit.id)
            onReload()
          }}
          onFailed={() => {
            setShowExecution(false)
            onReload()
          }}
          onBackToNewAudit={() => {
            navigate(ROUTES.auditNew)
          }}
          onRetry={() => {
            navigate(ROUTES.auditNew, {
              state: { autoStart: true, url: audit.websiteUrl ?? audit.domain },
            })
          }}
        />
      </AppPageShell>
    )
  }

  return <AuditDetailReport audit={audit} />
}

function AuditDetailReport({ audit }: { audit: AuditDetail }) {
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
              <span className="tabular-nums">{headerDate}</span>
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
            <AuditReportActions audit={audit} />
          </div>
        </header>

        {failed && audit.errorMessage ? (
          <AuthFormMessage className="audit-report-alert">{audit.errorMessage}</AuthFormMessage>
        ) : null}

        <div className="audit-report-layout">
          <div className="audit-report-layout__main">
            <AuditSummarySection audit={audit} />
            <AuditScoreExplanationSection audit={audit} />
            <ScoreBreakdownSection
              categories={audit.scoreBreakdown}
              auditStatus={audit.status}
            />
            <PageFindingsSection pages={audit.pageFindings} auditStatus={audit.status} />
            <SiteWideFindingsSection findings={audit.siteFindings} auditStatus={audit.status} />
            <PrioritizedIssuesSection
              issues={audit.issues}
              pages={audit.pageFindings}
              auditStatus={audit.status}
            />
            <AuditRecommendationsSection
              recommendations={audit.recommendations}
              pages={audit.pageFindings}
              domain={audit.domain}
            />
            <AuditMetadataSection audit={audit} />
          </div>

          <aside className="audit-report-layout__rail" aria-label="Audit timeline">
            <AuditTimelineSection events={audit.timeline} compact />
          </aside>
        </div>
      </div>
    </AppPageShell>
  )
}

export default AuditDetailPage
