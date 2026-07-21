import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { AuditExecutionView } from "@/components/audit/execution/AuditExecutionView"
import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { PageError } from "@/components/feedback/PageState"
import { Button } from "@/components/ui/button"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { AuditReportBody } from "@/features/audits/components/AuditReportBody"
import { AuditReportSkeleton } from "@/features/audits/components/AuditReportSkeleton"
import { DraftAuditScreen } from "@/features/audits/components/DraftAuditScreen"
import { useAsyncData } from "@/hooks/useAsyncData"
import { useVertlyPageContext } from "@/features/vertly/hooks/useVertly"
import { buildVertlyAuditSnapshotFromDetail } from "@/features/vertly/routing/buildVertlyAuditSnapshot"
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
  const [auditType, setAuditType] = useState<string | undefined>()

  useEffect(() => {
    if (!id) return
    void auditService.getAuditSessionDataById(id).then((sessionData) => {
      setAuditType(sessionData?.session.auditType)
    })
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
        header={null}
        sectionsClassName="audit-report-sections"
      >
        <div className="audit-report-page">
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.audits}>Back to audit history</Link>
          </Button>
        </div>
      </AppPageShell>
    )
  }

  if (isLoading && !audit) {
    return <AuditReportSkeleton />
  }

  if (isError) {
    return (
      <AppPageShell sectionsClassName="audit-report-sections" header={null}>
        <div className="audit-report-page">
          <PageError
            description={error ?? undefined}
            onRetry={() => {
              auditService.invalidateCompletedAuditDetail(id)
              reload()
            }}
          />
        </div>
      </AppPageShell>
    )
  }

  if (!audit) {
    return (
      <AppPageShell sectionsClassName="audit-report-sections" header={null}>
        <div className="audit-report-page">
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.audits}>Back to audit history</Link>
          </Button>
        </div>
      </AppPageShell>
    )
  }

  return <AuditDetailContent audit={audit} auditType={auditType} onReload={reload} />
}

function AuditDetailContent({
  audit,
  auditType,
  onReload,
}: {
  audit: AuditDetail
  auditType?: string
  onReload: (options?: { silent?: boolean }) => void
}) {
  const navigate = useNavigate()
  const running = isAuditInProgress(audit.status)
  const [showExecution, setShowExecution] = useState(running)

  const isDraft = audit.status === "draft"

  useEffect(() => {
    if (running) {
      setShowExecution(true)
    }
  }, [running, audit.id])

  if (isDraft) {
    return <DraftAuditScreen audit={audit} auditType={auditType} />
  }

  if (running && showExecution) {
    return (
      <AppPageShell
        header={null}
        className="app-page--execution"
        sectionsClassName="app-page-sections--execution gap-0"
      >
        <AuditExecutionView
          auditId={audit.id}
          vertlySurface="audit-detail"
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

  return <AuditDetailReport audit={audit} auditType={auditType} />
}

function AuditDetailReport({
  audit,
  auditType,
}: {
  audit: AuditDetail
  auditType?: string
}) {
  const failed = audit.status === "failed"

  const vertlyContext = useMemo(
    () => ({
      surface: "audit-detail" as const,
      title: audit.domain,
      description: `Reviewing ${audit.domain}`,
      auditContext: buildVertlyAuditSnapshotFromDetail(audit, { auditType }),
      metadata: {
        auditId: audit.id,
        domain: audit.domain,
        score: audit.overallScore,
        status: audit.status,
      },
    }),
    [audit, auditType]
  )

  useVertlyPageContext(vertlyContext)

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

        {failed && audit.errorMessage ? (
          <AuthFormMessage className="audit-report-alert">{audit.errorMessage}</AuthFormMessage>
        ) : null}

        <AuditReportBody audit={audit} showActions />
      </div>
    </AppPageShell>
  )
}

export default AuditDetailPage
