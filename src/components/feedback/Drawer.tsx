import { X } from "lucide-react"
import { useEffect, type ReactNode } from "react"

import { cn } from "@/lib/utils"

type DrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  className?: string
  side?: "left" | "right"
}

function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  className,
  side = "right",
}: DrawerProps) {
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
      className={cn(
        "fixed inset-0 z-50 flex",
        side === "left" ? "justify-start" : "justify-end"
      )}
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--background)_55%,transparent)] backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={cn(
          "relative flex h-full w-full max-w-md flex-col bg-[color-mix(in_srgb,var(--background-elevated)_96%,transparent)] shadow-[var(--shadow-medium)]",
          side === "left"
            ? "border-r border-[color-mix(in_srgb,var(--border)_75%,transparent)]"
            : "border-l border-[color-mix(in_srgb,var(--border)_75%,transparent)]",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[color-mix(in_srgb,var(--border)_65%,transparent)] px-6 py-5">
          <div className="min-w-0 space-y-1">
            <h2
              id="drawer-title"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              {title}
            </h2>
            {description ? (
              <p className="text-sm leading-6 text-muted">{description}</p>
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
      </aside>
    </div>
  )
}

export { Drawer }
