import { memo } from "react"
import type { RefObject } from "react"
import { Check, Circle, Loader2, X } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"

import type { AuditExecutionStage as AuditExecutionStageModel } from "@/types/auditExecution"
import { cn } from "@/lib/utils"

type AuditExecutionStageProps = {
  stage: AuditExecutionStageModel
  index: number
  isActive?: boolean
  activeRef?: RefObject<HTMLLIElement | null>
}

const AuditExecutionStage = memo(function AuditExecutionStage({
  stage,
  index,
  isActive = stage.status === "active",
  activeRef,
}: AuditExecutionStageProps) {
  const shouldReduceMotion = useReducedMotion()
  const isComplete = stage.status === "completed"
  const isFailed = stage.status === "failed"

  return (
    <motion.li
      ref={activeRef}
      className={cn(
        "audit-exec-stage",
        isActive && "audit-exec-stage--active",
        isComplete && "audit-exec-stage--completed",
        isFailed && "audit-exec-stage--failed"
      )}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.015, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="audit-exec-stage__icon" aria-hidden>
        {isComplete ? (
          <Check className="size-3.5" />
        ) : isFailed ? (
          <X className="size-3.5" />
        ) : isActive ? (
          <Loader2 className="size-3.5 audit-exec-stage__spinner" />
        ) : (
          <Circle className="size-3.5" />
        )}
      </span>
      <span className="audit-exec-stage__label">{stage.label}</span>
    </motion.li>
  )
})

export { AuditExecutionStage }
