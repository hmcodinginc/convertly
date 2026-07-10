import { memo } from "react"

import { AuditExecutionStage } from "@/components/audit/execution/AuditExecutionStage"
import type { AuditExecutionStage as AuditExecutionStageModel } from "@/types/auditExecution"

type AuditExecutionTimelineProps = {
  stages: AuditExecutionStageModel[]
}

const AuditExecutionTimeline = memo(function AuditExecutionTimeline({
  stages,
}: AuditExecutionTimelineProps) {
  const activeIndex = stages.findIndex((stage) => stage.status === "active")

  return (
    <ol className="audit-exec-timeline" aria-label="Audit pipeline">
      {stages.map((stage, index) => (
        <AuditExecutionStage key={stage.id} stage={stage} index={index} />
      ))}
      {activeIndex >= 0 ? (
        <span className="sr-only">
          Current stage: {stages[activeIndex]?.label}
        </span>
      ) : null}
    </ol>
  )
})

export { AuditExecutionTimeline }
