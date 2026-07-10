import { memo, useEffect, useState } from "react"
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

  useEffect(() => {
    if (shouldReduceMotion || value === display) {
      setDisplay(value)
      return
    }

    const start = display
    const end = value
    const startedAt = performance.now()
    const duration = 360
    let frame = 0

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      setDisplay(Math.round(start + (end - start) * progress))
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
    { label: "Screenshots captured", value: metrics.screenshotsCaptured },
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
