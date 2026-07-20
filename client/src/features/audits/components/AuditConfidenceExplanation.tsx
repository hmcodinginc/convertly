import { Check, ChevronDown, CircleAlert, Info } from "lucide-react"
import { useState } from "react"

import {
  buildConfidenceExplanationLines,
  getConfidenceDisplayLabel,
  getConfidenceTier,
} from "@/features/audits/utils/confidencePresentation"
import type { AuditRunMetadata } from "@/types/audit"
import { cn } from "@/lib/utils"

type AuditConfidenceExplanationProps = {
  metadata: AuditRunMetadata
  className?: string
}

function lineIcon(kind: "success" | "warning" | "info") {
  if (kind === "success") return Check
  if (kind === "warning") return CircleAlert
  return Info
}

function AuditConfidenceExplanation({ metadata, className }: AuditConfidenceExplanationProps) {
  const [expanded, setExpanded] = useState(false)

  if (metadata.auditConfidence == null) return null

  const tier = getConfidenceTier(metadata)
  const label = getConfidenceDisplayLabel(metadata)
  const lines = buildConfidenceExplanationLines(metadata)

  return (
    <div className={cn("audit-confidence-explanation", className)}>
      <button
        type="button"
        className="audit-confidence-explanation__toggle"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <span className="audit-confidence-explanation__title">Why this confidence?</span>
        <span className="audit-confidence-explanation__summary">
          {metadata.auditConfidence}%
          {label ? ` · ${label}` : ""}
        </span>
        <ChevronDown
          className={cn(
            "audit-confidence-explanation__icon size-4",
            expanded && "audit-confidence-explanation__icon--open"
          )}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div className="audit-confidence-explanation__panel">
          <div className="audit-confidence-explanation__headline">
            <p className="audit-confidence-explanation__score">
              {metadata.auditConfidence}%
              <span>audit confidence</span>
            </p>
            {tier ? (
              <p className="audit-confidence-explanation__tier">{label}</p>
            ) : null}
          </div>

          {metadata.reliabilityReport?.summary ? (
            <p className="audit-confidence-explanation__summary-text">
              {metadata.reliabilityReport.summary}
            </p>
          ) : null}

          {lines.length > 0 ? (
            <ul className="audit-confidence-explanation__list" role="list">
              {lines.map((line) => {
                const Icon = lineIcon(line.kind)
                return (
                  <li
                    key={line.text}
                    className={cn(
                      "audit-confidence-explanation__item",
                      `audit-confidence-explanation__item--${line.kind}`
                    )}
                  >
                    <Icon className="audit-confidence-explanation__item-icon size-4 shrink-0" aria-hidden />
                    <span>{line.text}</span>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export { AuditConfidenceExplanation }
