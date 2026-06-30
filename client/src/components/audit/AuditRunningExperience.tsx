import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"

import { ConvertlyMark } from "@/components/brand/ConvertlyMark"
import { ConvertlyMarkAnimated } from "@/components/brand/ConvertlyMarkAnimated"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { AUDIT_LOADING_PHASES } from "@/services/audit/constants"
import type { AuditSessionStatus } from "@/types/auditEngine"
import { cn } from "@/lib/utils"

type AuditRunningExperienceProps = {
  status?: AuditSessionStatus
  className?: string
}

const STATUS_TO_PHASE_INDEX: Partial<Record<AuditSessionStatus, number>> = {
  pending: 0,
  crawling: 0,
  analyzing: 2,
  completed: AUDIT_LOADING_PHASES.length - 1,
  failed: AUDIT_LOADING_PHASES.length - 1,
}

function AuditRunningExperience({ status = "pending", className }: AuditRunningExperienceProps) {
  const shouldReduceMotion = useReducedMotion()
  const statusFloor = STATUS_TO_PHASE_INDEX[status] ?? 0
  const [tickIndex, setTickIndex] = useState(0)
  const phaseIndex = Math.max(tickIndex, statusFloor)
  const isLongWaitPhase = phaseIndex < 2
  const shouldSpinLogo =
    isLongWaitPhase && !shouldReduceMotion && status !== "completed" && status !== "failed"

  useEffect(() => {
    if (status === "completed" || status === "failed") return

    const interval = window.setInterval(() => {
      setTickIndex((current) => {
        const cap = STATUS_TO_PHASE_INDEX[status] ?? AUDIT_LOADING_PHASES.length - 1
        if (current >= cap) return current
        return current + 1
      })
    }, 1800)

    return () => window.clearInterval(interval)
  }, [status])

  const activePhase = AUDIT_LOADING_PHASES[phaseIndex] ?? AUDIT_LOADING_PHASES[0]

  return (
    <Card
      className={cn(
        "app-card-body flex flex-col items-center gap-8 py-12 hover:translate-y-0",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="audit-running-logo" aria-hidden>
          <AnimatePresence mode="wait">
            {shouldSpinLogo ? (
              <motion.div
                key="audit-logo-spinning"
                className="audit-running-logo__rotor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.33, 1, 0.32, 1] }}
              >
                <ConvertlyMark size={36} />
              </motion.div>
            ) : (
              <motion.div
                key="audit-logo-animated"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <ConvertlyMarkAnimated
                  size={36}
                  variant={shouldReduceMotion && isLongWaitPhase ? "static" : "loading"}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="space-y-2 text-center">
          <p className="text-lg font-medium tracking-tight text-foreground">
            {activePhase}
          </p>
          <Text variant="muted" size="sm" className="max-w-md">
            Convertly is scanning your site and preparing conversion insights. This
            usually takes under a minute.
          </Text>
        </div>
      </div>

      <ol className="flex w-full max-w-md flex-col gap-2" aria-label="Audit progress">
        {AUDIT_LOADING_PHASES.map((phase, index) => {
          const isComplete = index < phaseIndex
          const isActive = index === phaseIndex

          return (
            <li
              key={phase}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 transition-colors duration-300",
                isActive &&
                  "bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface))]",
                isComplete && "opacity-70"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                  isComplete &&
                    "border-[color-mix(in_srgb,#34d399_40%,var(--border))] bg-[color-mix(in_srgb,#34d399_12%,var(--surface))] text-[#86efac]",
                  isActive &&
                    "border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_14%,var(--surface))] text-[color-mix(in_srgb,var(--accent)_75%,white)]",
                  !isComplete &&
                    !isActive &&
                    "border-[color-mix(in_srgb,var(--border)_80%,transparent)] text-muted"
                )}
                aria-hidden
              >
                {isComplete ? "✓" : index + 1}
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={isActive ? `${phase}-active` : phase}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "text-sm",
                    isActive ? "font-medium text-foreground" : "text-foreground/65"
                  )}
                >
                  {phase}
                </motion.span>
              </AnimatePresence>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

export { AuditRunningExperience }
