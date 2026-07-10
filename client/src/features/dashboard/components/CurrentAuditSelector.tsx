import { AnimatePresence, motion } from "framer-motion"
import { Check, ChevronDown } from "lucide-react"
import * as React from "react"
import { Link } from "react-router-dom"

import { AuditStatusBadge } from "@/components/audit/AuditStatusBadge"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography/Text"
import { ROUTES } from "@/lib/routes"
import type { Audit } from "@/types/audit"
import { cn } from "@/lib/utils"

type CurrentAuditSelectorProps = {
  audits: Audit[]
  selectedAuditId: string | null
  onSelect: (auditId: string) => void
}

function CurrentAuditSelector({
  audits,
  selectedAuditId,
  onSelect,
}: CurrentAuditSelectorProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [open, setOpen] = React.useState(false)

  const selected = audits.find((audit) => audit.id === selectedAuditId) ?? audits[0]

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

  if (!selected) {
    return null
  }

  return (
    <section className="dashboard-current-audit rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[color-mix(in_srgb,var(--surface)_52%,transparent)] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="dashboard-current-audit__selector min-w-0">
          <Text
            size="sm"
            className="max-w-none font-medium tracking-[0.14em] uppercase text-foreground/55"
          >
            Current audit
          </Text>
          <div ref={containerRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-haspopup="listbox"
              className={cn(
                "flex w-full min-w-[min(100%,18rem)] items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_65%,transparent)] bg-[color-mix(in_srgb,var(--background)_40%,transparent)] px-4 py-3 text-left transition-[border-color,background-color] duration-[var(--motion-fast)] hover:border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] hover:bg-[color-mix(in_srgb,var(--surface)_72%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)] sm:min-w-[22rem]"
              )}
            >
              <span className="min-w-0">
                <span className="block truncate text-base font-medium text-foreground">
                  {selected.domain}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted">
                  <span className="tabular-nums">{selected.completedAt}</span>
                  <span aria-hidden>·</span>
                  <span className="tabular-nums">Score {selected.conversionScore}</span>
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted transition-transform duration-[var(--motion-fast)]",
                  open && "rotate-180"
                )}
                aria-hidden
              />
            </button>

            <AnimatePresence>
              {open ? (
                <motion.ul
                  role="listbox"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute z-30 mt-2 max-h-72 w-full min-w-[min(100%,18rem)] overflow-y-auto rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_75%,transparent)] bg-[color-mix(in_srgb,var(--surface)_96%,transparent)] p-1.5 shadow-[0_18px_48px_-24px_rgba(0,0,0,0.9)] backdrop-blur-md sm:min-w-[22rem]"
                >
                  {audits.map((audit) => {
                    const isSelected = audit.id === selected.id
                    return (
                      <li key={audit.id} role="option" aria-selected={isSelected}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(audit.id)
                            setOpen(false)
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]",
                            isSelected && "bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {audit.domain}
                            </span>
                            <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                              <span className="tabular-nums">{audit.completedAt}</span>
                              <span className="tabular-nums font-medium text-foreground/80">
                                {audit.conversionScore}
                              </span>
                              <AuditStatusBadge status={audit.status} />
                            </span>
                          </span>
                          {isSelected ? (
                            <Check className="size-4 shrink-0 text-[color-mix(in_srgb,var(--accent)_85%,white)]" />
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </motion.ul>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <Link to={ROUTES.audits}>View all audits</Link>
        </Button>
      </div>
    </section>
  )
}

export { CurrentAuditSelector }
