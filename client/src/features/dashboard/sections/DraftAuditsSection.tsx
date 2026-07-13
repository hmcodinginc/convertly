import { Trash2 } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { DeleteAuditModal } from "@/features/audits/components/DeleteAuditModal"
import { AppPageSection } from "@/components/layout/AppPageSection"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { getAuditTypeLabel } from "@/lib/auditTypes"
import { ROUTES } from "@/lib/routes"
import * as auditService from "@/services/auditService"
import type { AuditDraft } from "@/types/auditDraft"
import type { Audit } from "@/types/audit"

type DraftAuditsSectionProps = {
  drafts: AuditDraft[]
  onChanged: () => void
}

function formatEditedAt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function DraftAuditsSection({ drafts, onChanged }: DraftAuditsSectionProps) {
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<AuditDraft | null>(null)

  if (drafts.length === 0) return null

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await auditService.deleteAudit(deleteTarget.id)
    setDeleteTarget(null)
    onChanged()
  }

  return (
    <>
      <AppPageSection
        eyebrow="Drafts"
        title="Draft audits"
        description="Saved configurations you can resume when you're ready to run."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {drafts.map((draft) => (
            <Card key={draft.id} className="app-card-compact flex flex-col gap-4 hover:translate-y-0">
              <div className="space-y-1">
                <Text size="sm" className="max-w-none font-medium text-foreground">
                  {draft.websiteUrl}
                </Text>
                <Text variant="muted" size="sm" className="max-w-none">
                  {getAuditTypeLabel(draft.auditType)}
                </Text>
                <Text variant="muted" size="sm" className="max-w-none text-xs">
                  Last edited {formatEditedAt(draft.updatedAt)}
                </Text>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    navigate(ROUTES.auditNew, {
                      state: {
                        url: draft.websiteUrl,
                        draftId: draft.id,
                        auditType: draft.auditType,
                      },
                    })
                  }
                >
                  Resume
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTarget(draft)}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Delete Draft
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </AppPageSection>

      <DeleteAuditModal
        audit={
          deleteTarget
            ? ({
                id: deleteTarget.id,
                name: deleteTarget.websiteUrl,
                domain: deleteTarget.websiteUrl,
                websiteUrl: deleteTarget.websiteUrl,
                completedAt: deleteTarget.updatedAt,
                conversionScore: 0,
                pagesScanned: 0,
                status: "draft",
              } as Audit)
            : null
        }
        open={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        onConfirmDelete={handleConfirmDelete}
        title="Delete draft"
        description="This permanently removes the saved draft configuration."
        confirmLabel="Delete draft"
      />
    </>
  )
}

export { DraftAuditsSection }
