import { AnimatePresence, motion } from "framer-motion"
import { Copy, FileText, MoreHorizontal, Trash2 } from "lucide-react"
import * as React from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { isDeletableAudit } from "@/lib/auditHistoryUtils"
import { ROUTES, auditDetailPath } from "@/lib/routes"
import { showErrorToast } from "@/lib/toast"
import { exportAuditReport } from "@/services/export"
import type { Audit } from "@/types/audit"
import { cn } from "@/lib/utils"

type RecentAuditRowActionsProps = {
  audit: Audit
  onDeleteRequest: (audit: Audit) => void
  className?: string
}

function RecentAuditRowActions({
  audit,
  onDeleteRequest,
  className,
}: RecentAuditRowActionsProps) {
  const navigate = useNavigate()
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [open, setOpen] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)

  React.useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  async function handleDownloadPdf() {
    setExporting(true)
    try {
      await exportAuditReport(audit.id, "pdf")
      setOpen(false)
    } catch (error) {
      showErrorToast("PDF export failed", error)
    } finally {
      setExporting(false)
    }
  }

  function handleDuplicate() {
    const url = audit.websiteUrl ?? `https://${audit.domain}`
    navigate(ROUTES.auditNew, { state: { url, autoStart: true } })
    setOpen(false)
  }

  return (
    <div
      className={cn("dashboard-recent-audits__actions-toolbar", className)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Button
        variant="ghost"
        size="sm"
        className="dashboard-recent-audits__action-btn"
        asChild
      >
        <Link to={auditDetailPath(audit.id)}>View report</Link>
      </Button>

      <div ref={containerRef} className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="dashboard-recent-audits__action-btn dashboard-recent-audits__action-btn--icon"
          aria-label={`More actions for ${audit.domain}`}
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((value) => !value)}
        >
          <MoreHorizontal className="size-4" />
        </Button>

        <AnimatePresence>
          {open ? (
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.14 }}
              className="absolute right-0 z-20 mt-1 min-w-[11rem] rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_75%,transparent)] bg-[color-mix(in_srgb,var(--surface)_96%,transparent)] p-1 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md"
            >
              <button
                type="button"
                role="menuitem"
                disabled={exporting}
                onClick={() => void handleDownloadPdf()}
                className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-foreground/90 hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] disabled:opacity-50"
              >
                <FileText className="size-3.5" />
                Download PDF
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleDuplicate}
                className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-foreground/90 hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
              >
                <Copy className="size-3.5" />
                Duplicate audit
              </button>
              {isDeletableAudit(audit.id) ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onDeleteRequest(audit)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-[#fca5a5] hover:bg-[color-mix(in_srgb,#f87171_12%,transparent)]"
                >
                  <Trash2 className="size-3.5" />
                  Delete audit
                </button>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

export { RecentAuditRowActions }
