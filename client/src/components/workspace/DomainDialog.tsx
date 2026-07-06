import { useState } from "react"

import { Modal } from "@/components/feedback/Modal"
import { TextField } from "@/components/forms/TextField"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography/Text"

type DomainDialogProps = {
  open: boolean
  onClose: () => void
  onSubmit: (hostname: string) => Promise<void>
  title?: string
  initialHostname?: string
}

function DomainDialog({
  open,
  onClose,
  onSubmit,
  title = "Add domain",
  initialHostname = "",
}: DomainDialogProps) {
  const [hostname, setHostname] = useState(initialHostname)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    setError(null)
    setIsSubmitting(true)
    try {
      await onSubmit(hostname)
      setHostname("")
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save domain.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <Text variant="muted" size="sm" className="max-w-none leading-6">
          Add a hostname you monitor or audit regularly. Use the root domain only (e.g. acme.io).
        </Text>
        <TextField
          label="Hostname"
          value={hostname}
          onChange={(event) => {
            setHostname(event.target.value)
            if (error) setError(null)
          }}
          placeholder="yourcompany.com"
          error={error ?? undefined}
          autoComplete="off"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save domain"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export { DomainDialog }
