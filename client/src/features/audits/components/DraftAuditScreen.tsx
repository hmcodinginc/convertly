import { ArrowLeft, FileText, Play, Trash2 } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { Heading } from "@/components/ui/typography/Heading"
import { DeleteAuditModal } from "@/features/audits/components/DeleteAuditModal"
import { getAuditTypeLabel, resolveStoredAuditType } from "@/lib/auditTypes"
import { ROUTES } from "@/lib/routes"
import * as auditService from "@/services/auditService"
import type { Audit, AuditDetail } from "@/types/audit"

type DraftAuditScreenProps = {
  audit: AuditDetail
  auditType?: string
}

/**
 * Shown when a draft audit is opened from audit history.
 * Offers the same choices as the dashboard drafts section:
 * restart via the regular New Audit flow, or delete the draft.
 */
function DraftAuditScreen({ audit, auditType }: DraftAuditScreenProps) {
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const resolvedType = resolveStoredAuditType(auditType)
  const websiteUrl = audit.websiteUrl ?? audit.domain

  const deleteTarget: Audit = {
    id: audit.id,
    name: audit.name || websiteUrl,
    domain: audit.domain,
    websiteUrl,
    completedAt: audit.completedAt,
    pagesScanned: 0,
    conversionScore: 0,
    status: "draft",
  }

  function handleRestart() {
    navigate(ROUTES.auditNew, {
      state: {
        url: websiteUrl,
        draftId: audit.id,
        auditType: resolvedType,
      },
    })
  }

  async function handleConfirmDelete() {
    await auditService.deleteAudit(audit.id)
    navigate(ROUTES.audits, { replace: true })
  }

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

        <Card className="app-card-body mx-auto w-full max-w-2xl hover:translate-y-0">
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface))] text-[var(--accent)]">
                  <FileText className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 space-y-1">
                  <Heading level={1} size="section" className="break-all">
                    {websiteUrl}
                  </Heading>
                  <Text variant="muted" size="sm" className="max-w-none">
                    {getAuditTypeLabel(resolvedType)}
                  </Text>
                </div>
              </div>
              <StatusBadge label="Draft" variant="neutral" />
            </div>

            <Text variant="muted" size="sm" className="max-w-none leading-6">
              This audit is saved as a draft — no run is in progress and no audit
              allowance has been used. Restart it to run a fresh audit with this
              configuration, or delete the draft if you no longer need it.
            </Text>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="sm" className="w-full sm:w-auto" onClick={handleRestart}>
                <Play className="size-4" aria-hidden />
                Restart audit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" aria-hidden />
                Delete draft
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <DeleteAuditModal
        audit={deleteTarget}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirmDelete={handleConfirmDelete}
        title="Delete draft"
        description="This permanently removes the saved draft configuration."
        confirmLabel="Delete draft"
      />
    </AppPageShell>
  )
}

export { DraftAuditScreen }
