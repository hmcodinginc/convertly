import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { ConvertlyMark } from "@/components/brand/ConvertlyMark"
import { AuditExecutionProgress } from "@/components/audit/execution/AuditExecutionProgress"
import { AuditExecutionStats } from "@/components/audit/execution/AuditExecutionStats"
import { AuditExecutionSummary } from "@/components/audit/execution/AuditExecutionSummary"
import { AuditExecutionTimeline } from "@/components/audit/execution/AuditExecutionTimeline"
import type { AuditDetail } from "@/types/audit"
import type { AuditExecutionState } from "@/types/auditExecution"

import "./audit-execution.css"

type AuditExecutionScreenProps = {
  state: AuditExecutionState | null
  displayPercentage: number
  isLoading?: boolean
  showCompletion?: boolean
  completionDetail?: AuditDetail | null
  className?: string
}

const RUNNING_TRANSITION = { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const }
const SUMMARY_TRANSITION = { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }

function AuditExecutionScreen({
  state,
  displayPercentage,
  isLoading = false,
  showCompletion = false,
  completionDetail = null,
  className,
}: AuditExecutionScreenProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className={`audit-exec-screen ${showCompletion ? "audit-exec-screen--summary" : ""} ${className ?? ""}`}>
      <AnimatePresence mode="wait" initial={false}>
        {showCompletion && completionDetail ? (
          <motion.div
            key="summary"
            className="audit-exec-screen__summary-wrap"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={SUMMARY_TRANSITION}
          >
            <AuditExecutionSummary detail={completionDetail} />
          </motion.div>
        ) : (
          <motion.div
            key="running"
            className="audit-exec-screen__running-wrap"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={RUNNING_TRANSITION}
          >
            <div className="audit-exec-screen__glow" aria-hidden />

            <header className="audit-exec-screen__header">
              <div className="audit-exec-screen__brand">
                <div className="audit-exec-screen__logo" aria-hidden>
                  <div className="audit-running-logo__rotor">
                    <ConvertlyMark size={32} />
                  </div>
                </div>
                <div>
                  <p className="audit-exec-screen__eyebrow">Convertly Audit</p>
                  <h1 className="audit-exec-screen__title">
                    {state?.domain ?? "Analyzing website"}
                  </h1>
                  <p className="audit-exec-screen__url">{state?.websiteUrl ?? "Preparing..."}</p>
                </div>
              </div>
            </header>

            <div className="audit-exec-screen__layout">
              <section className="audit-exec-screen__primary" aria-live="polite">
                {isLoading || !state ? (
                  <div className="audit-exec-screen__skeleton">
                    <div className="audit-exec-skeleton audit-exec-skeleton--ring" />
                    <div className="audit-exec-skeleton audit-exec-skeleton--line" />
                    <div className="audit-exec-skeleton audit-exec-skeleton--line short" />
                  </div>
                ) : (
                  <>
                    <AuditExecutionProgress
                      percentage={displayPercentage}
                      etaSeconds={state.etaSeconds}
                      currentTask={state.currentTask}
                    />

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={state.insight}
                        className="audit-exec-insight"
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <span className="audit-exec-insight__avatar" aria-hidden>
                          <ConvertlyMark size={16} />
                        </span>
                        <p className="audit-exec-insight__text">{state.insight}</p>
                      </motion.div>
                    </AnimatePresence>

                    <AuditExecutionStats metrics={state.metrics} />
                  </>
                )}
              </section>

              <aside className="audit-exec-screen__timeline" aria-label="Pipeline stages">
                <p className="audit-exec-screen__timeline-heading">Pipeline</p>
                {state ? <AuditExecutionTimeline stages={state.stages} /> : null}
              </aside>
            </div>

            {state?.status === "failed" && state.errorMessage ? (
              <p className="audit-exec-screen__error" role="alert">
                {state.errorMessage}
              </p>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { AuditExecutionScreen }
