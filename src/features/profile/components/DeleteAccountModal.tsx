import { AlertTriangle, Loader2 } from "lucide-react"
import { useState } from "react"

import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { Modal } from "@/components/feedback/Modal"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Text } from "@/components/ui/typography/Text"

const deletionItems = [
  "Profile information",
  "Audit history",
  "Workspace data",
  "Settings",
  "Future subscription records",
] as const

const deletionTerms =
  "By deleting your account you acknowledge that all stored account information, settings, audit history, workspace data and future subscription records will be permanently removed."

type DeleteAccountModalProps = {
  open: boolean
  onClose: () => void
  onConfirmDelete: () => Promise<void>
}

function DeleteAccountModal({ open, onClose, onConfirmDelete }: DeleteAccountModalProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    if (isDeleting) return
    setAgreedToTerms(false)
    setError(null)
    onClose()
  }

  async function handleDelete() {
    if (!agreedToTerms || isDeleting) return

    setIsDeleting(true)
    setError(null)

    try {
      await onConfirmDelete()
      setAgreedToTerms(false)
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete account. Please try again."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="WARNING"
      panelClassName="max-w-md border-[color-mix(in_srgb,#ef4444_42%,var(--border))] shadow-[0_28px_64px_-24px_rgba(239,68,68,0.35),var(--shadow-medium)]"
      footer={
        <div className="profile-delete-modal-footer">
          <div className="profile-delete-modal-actions">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              onClick={handleClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-9 border border-[color-mix(in_srgb,#ef4444_65%,transparent)] bg-[#dc2626] hover:bg-[#b91c1c]"
              onClick={() => void handleDelete()}
              disabled={!agreedToTerms || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Deleting…
                </>
              ) : (
                "Delete account"
              )}
            </Button>
          </div>
          <Text variant="muted" size="sm" className="max-w-none text-right">
            This action cannot be undone.
          </Text>
        </div>
      }
    >
      <div className="profile-delete-modal-body">
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[color-mix(in_srgb,#ef4444_38%,transparent)] bg-[color-mix(in_srgb,#ef4444_10%,transparent)] p-4">
          <AlertTriangle
            className="mt-0.5 size-5 shrink-0 text-[#f87171]"
            aria-hidden
          />
          <div className="space-y-2">
            <Text size="sm" className="max-w-none font-semibold leading-6">
              You are about to permanently delete your Convertly account.
            </Text>
            <Text variant="muted" size="sm" className="max-w-none leading-6">
              This cannot be reversed. All data listed below will be removed.
            </Text>
          </div>
        </div>

        <div className="space-y-2.5">
          <Text size="sm" className="max-w-none font-medium text-foreground/88">
            This action will permanently remove:
          </Text>
          <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
            {deletionItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="profile-delete-terms-scroll" tabIndex={0}>
          {deletionTerms}
        </div>

        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[color-mix(in_srgb,#ef4444_32%,transparent)] bg-[color-mix(in_srgb,#ef4444_8%,transparent)] px-3.5 py-3">
          <Checkbox
            id="delete-account-terms"
            checked={agreedToTerms}
            onChange={(event) => setAgreedToTerms(event.target.checked)}
            disabled={isDeleting}
            className="mt-0.5 accent-[#ef4444]"
          />
          <Label
            htmlFor="delete-account-terms"
            className="text-sm leading-6 text-foreground/90"
          >
            I understand and agree.
          </Label>
        </div>

        {error ? <AuthFormMessage>{error}</AuthFormMessage> : null}
      </div>
    </Modal>
  )
}

export { DeleteAccountModal }
