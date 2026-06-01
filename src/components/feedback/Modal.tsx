import { X } from "lucide-react"
import { useEffect, useId, type ReactNode } from "react"

import { cn } from "@/lib/utils"

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  className?: string
  panelClassName?: string
  footer?: ReactNode
}

function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  panelClassName,
  footer,
}: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className={cn("fixed inset-0 z-50 flex items-center justify-center p-4", className)}
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--background)_62%,transparent)] backdrop-blur-md"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "relative flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[color-mix(in_srgb,var(--background-elevated)_96%,transparent)] shadow-[var(--shadow-medium)]",
          panelClassName
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[color-mix(in_srgb,var(--border)_65%,transparent)] px-6 py-5">
          <div className="min-w-0 space-y-1">
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="text-sm leading-6 text-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-foreground/70 transition-colors hover:bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

        {footer ? (
          <div className="border-t border-[color-mix(in_srgb,var(--border)_65%,transparent)] px-6 py-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export { Modal }
