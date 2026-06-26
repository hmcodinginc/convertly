import type { FindingSeverity } from "@/types/auditEngine"
import type { DetectorResult } from "@/services/audit/intelligence/types"
import { inferConfidenceFromSeverity } from "@/services/audit/intelligence/rules/productionRuleCatalog"

const SEVERITY_BASE: Record<FindingSeverity, number> = {
  critical: 96,
  high: 88,
  medium: 76,
  low: 62,
}

export function calculateConfidence(options: {
  severity: FindingSeverity
  detector?: DetectorResult
  fetchSucceeded?: boolean
  rendered?: boolean
}): number {
  let confidence = options.detector?.confidence ?? SEVERITY_BASE[options.severity]

  if (options.fetchSucceeded === false) {
    confidence = Math.min(confidence, 45)
  }

  if (options.rendered) {
    confidence = Math.min(98, confidence + 4)
  }

  if (options.detector?.evidence?.length) {
    confidence = Math.min(98, confidence + options.detector.evidence.length * 2)
  }

  return Math.round(Math.max(40, Math.min(98, confidence)))
}

export function formatConfidenceLabel(confidence: number): string {
  return `${confidence}%`
}

export function confidenceFromSeverity(severity: FindingSeverity): number {
  return inferConfidenceFromSeverity(severity)
}
