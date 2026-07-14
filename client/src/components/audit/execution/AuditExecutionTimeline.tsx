import { memo, useEffect, useRef } from "react"

import { AuditExecutionStage } from "@/components/audit/execution/AuditExecutionStage"
import type { AuditExecutionStage as AuditExecutionStageModel } from "@/types/auditExecution"

type AuditExecutionTimelineProps = {
  stages: AuditExecutionStageModel[]
}

const AuditExecutionTimeline = memo(function AuditExecutionTimeline({
  stages,
}: AuditExecutionTimelineProps) {
  const activeRef = useRef<HTMLLIElement>(null)
  const activeIndex = stages.findIndex((stage) => stage.status === "active")

  useEffect(() => {
    if (activeIndex < 0) return
    activeRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    })
  }, [activeIndex, stages[activeIndex]?.id])

  return (
    <ol className="audit-exec-timeline" aria-label="Audit pipeline">
      {stages.map((stage, index) => (
        <AuditExecutionStage
          key={stage.id}
          stage={stage}
          index={index}
          isActive={stage.status === "active"}
          activeRef={stage.status === "active" ? activeRef : undefined}
        />
      ))}
      {activeIndex >= 0 ? (
        <span className="sr-only">Current stage: {stages[activeIndex]?.label}</span>
      ) : null}
    </ol>
  )
})

export { AuditExecutionTimeline }
