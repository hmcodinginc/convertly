import { memo, useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"

type AuditExecutionProgressProps = {
  percentage: number
  etaSeconds: number | null
  currentTask: string
}

function formatEta(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return "Estimating..."
  if (seconds < 60) return `~${seconds}s remaining`
  const minutes = Math.ceil(seconds / 60)
  return `~${minutes} min remaining`
}

const AuditExecutionProgress = memo(function AuditExecutionProgress({
  percentage,
  etaSeconds,
  currentTask,
}: AuditExecutionProgressProps) {
  const shouldReduceMotion = useReducedMotion()
  const [displayValue, setDisplayValue] = useState(percentage)
  const displayRef = useRef(displayValue)

  useEffect(() => {
    displayRef.current = displayValue
  }, [displayValue])

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(percentage)
      return
    }

    const start = displayRef.current
    const end = percentage
    if (start === end) return

    const startedAt = performance.now()
    const duration = 520

    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      const eased = 1 - (1 - progress) ** 3
      setDisplayValue(Math.round(start + (end - start) * eased))
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [percentage, shouldReduceMotion])

  return (
    <div className="audit-exec-progress">
      <div className="audit-exec-progress__ring" aria-hidden>
        <svg viewBox="0 0 120 120" className="audit-exec-progress__svg">
          <circle cx="60" cy="60" r="52" className="audit-exec-progress__track" />
          <circle
            cx="60"
            cy="60"
            r="52"
            className="audit-exec-progress__fill"
            style={{
              strokeDasharray: `${2 * Math.PI * 52}`,
              strokeDashoffset: `${2 * Math.PI * 52 * (1 - displayValue / 100)}`,
            }}
          />
        </svg>
        <div className="audit-exec-progress__value">
          <span className="audit-exec-progress__percent">{displayValue}</span>
          <span className="audit-exec-progress__unit">%</span>
        </div>
      </div>

      <div className="audit-exec-progress__meta">
        <p className="audit-exec-progress__task">{currentTask}</p>
        <p className="audit-exec-progress__eta">{formatEta(etaSeconds)}</p>
      </div>
    </div>
  )
})

export { AuditExecutionProgress }
