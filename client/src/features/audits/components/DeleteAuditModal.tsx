import { AlertTriangle, Loader2 } from "lucide-react"
import { useState } from "react"

import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { Modal } from "@/components/feedback/Modal"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography/Text"
import type { Audit } from "@/types/audit"

type DeleteAuditModalProps = {
  open: boolean
  audit: Audit | null
  onClose: () => void
  onConfirmDelete: () => Promise<void>
  title?: string
  description?: string
  confirmLabel?: string
}

function DeleteAuditModal({
  open,
  audit,
  onClose,
  onConfirmDelete,
  title = "Delete audit",
  description = "This permanently removes the audit and all related data.",
  confirmLabel = "Delete audit",
}: DeleteAuditModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function resetState() {
    setError(null)
    setIsDeleting(false)
  }

  function handleClose() {
    if (isDeleting) return
    resetState()
    onClose()
  }

  async function handleDelete() {
    if (!audit || isDeleting) return

    setIsDeleting(true)
    setError(null)

    try {
      await onConfirmDelete()
      onClose()
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete audit. Please try again."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      description={description}
      panelClassName="max-w-md border-[color-mix(in_srgb,#ef4444_42%,var(--border))] shadow-[0_28px_64px_-24px_rgba(239,68,68,0.35),var(--shadow-medium)]"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Text variant="muted" size="sm" className="max-w-none">
            This action cannot be undone.
          </Text>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="border border-[color-mix(in_srgb,#ef4444_65%,transparent)] bg-[#dc2626] hover:bg-[#b91c1c]"
              onClick={() => void handleDelete()}
              disabled={!audit || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Deleting…
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[color-mix(in_srgb,#ef4444_38%,transparent)] bg-[color-mix(in_srgb,#ef4444_10%,transparent)] p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#f87171]" aria-hidden />
          <div className="space-y-2">
            <Text size="sm" className="max-w-none font-semibold leading-6">
              {audit
                ? `Delete "${audit.name}"?`
                : "Delete this audit?"}
            </Text>
            <Text variant="muted" size="sm" className="max-w-none leading-6">
              {audit
                ? `This removes the audit for ${audit.websiteUrl ?? audit.domain}, including pages, findings, scores, and history.`
                : "This removes the audit record and all related data."}
            </Text>
          </div>
        </div>

        {error ? <AuthFormMessage>{error}</AuthFormMessage> : null}
      </div>
    </Modal>
  )
}

export { DeleteAuditModal }
