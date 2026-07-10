import { Check } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"

import { ConvertlyMarkAnimated } from "@/components/brand/ConvertlyMarkAnimated"
import type { AuditDetail } from "@/types/audit"

type AuditExecutionSummaryProps = {
  detail: AuditDetail
  topOpportunity?: string
}

function AuditExecutionSummary({ detail, topOpportunity }: AuditExecutionSummaryProps) {
  const shouldReduceMotion = useReducedMotion()
  const issueCount =
    detail.stats.totalFindings ||
    detail.issues.length + detail.siteFindings.length

  const opportunity =
    topOpportunity ??
    detail.recommendations[0]?.title ??
    detail.issues[0]?.issue ??
    "Review prioritized recommendations in your report"

  return (
    <motion.div
      className="audit-exec-summary"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      aria-live="polite"
    >
      <div className="audit-exec-summary__icon" aria-hidden>
        <ConvertlyMarkAnimated size={40} variant={shouldReduceMotion ? "static" : "idle"} />
      </div>

      <div className="audit-exec-summary__badge">
        <Check className="size-4" aria-hidden />
        Audit complete
      </div>

      <div className="audit-exec-summary__score">
        <motion.span
          className="audit-exec-summary__score-value"
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          {detail.overallScore}
        </motion.span>
        <span className="audit-exec-summary__score-label">Growth Score</span>
      </div>

      <p className="audit-exec-summary__issues">
        {issueCount} issue{issueCount === 1 ? "" : "s"} found across {detail.pagesAnalyzed} pages
      </p>

      <div className="audit-exec-summary__opportunity">
        <p className="audit-exec-summary__opportunity-label">Biggest opportunity</p>
        <p className="audit-exec-summary__opportunity-value">{opportunity}</p>
      </div>

      <p className="audit-exec-summary__opening">Opening report...</p>
    </motion.div>
  )
}

export { AuditExecutionSummary }
