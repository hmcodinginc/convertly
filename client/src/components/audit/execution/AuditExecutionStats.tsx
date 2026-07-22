import { memo, useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"

import type { AuditExecutionMetrics } from "@/types/auditExecution"

type AuditExecutionStatsProps = {
  metrics: AuditExecutionMetrics
}

type StatItem = {
  label: string
  value: number
}

function AnimatedStat({ label, value }: StatItem) {
  const shouldReduceMotion = useReducedMotion()
  const [display, setDisplay] = useState(value)
  const displayRef = useRef(display)

  useEffect(() => {
    displayRef.current = display
  }, [display])

  useEffect(() => {
    if (shouldReduceMotion || value === displayRef.current) {
      setDisplay(value)
      return
    }

    const start = displayRef.current
    const end = value
    const startedAt = performance.now()
    const duration = 400
    let frame = 0

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      const eased = 1 - (1 - progress) ** 2
      setDisplay(Math.round(start + (end - start) * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, shouldReduceMotion])

  return (
    <div className="audit-exec-stat">
      <p className="audit-exec-stat__value">{display}</p>
      <p className="audit-exec-stat__label">{label}</p>
    </div>
  )
}

const AuditExecutionStats = memo(function AuditExecutionStats({
  metrics,
}: AuditExecutionStatsProps) {
  const items: StatItem[] = [
    { label: "Pages discovered", value: metrics.pagesDiscovered },
    { label: "Pages analyzed", value: metrics.pagesAnalyzed },
    { label: "Rules evaluated", value: metrics.rulesEvaluated },
    { label: "Findings detected", value: metrics.findingsDetected },
    { label: "Critical issues", value: metrics.criticalIssues },
    { label: "High issues", value: metrics.highIssues },
    { label: "Medium issues", value: metrics.mediumIssues },
    { label: "Low issues", value: metrics.lowIssues },
  ]

  return (
    <div className="audit-exec-stats" aria-label="Live audit metrics">
      {items.map((item) => (
        <AnimatedStat key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  )
})

export { AuditExecutionStats }
