import { ArrowLeft, RefreshCw, TriangleAlert } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography/Text"
import { AUDIT_INTERRUPTED_MESSAGE } from "@/lib/auditReliability"
import { ROUTES } from "@/lib/routes"

type AuditExecutionInterruptedProps = {
  domain?: string
  message?: string | null
  onRetry?: () => void
  onBack?: () => void
  className?: string
}

function AuditExecutionInterrupted({
  domain,
  message,
  onRetry,
  onBack,
  className,
}: AuditExecutionInterruptedProps) {
  return (
    <div className={`audit-exec-outcome audit-exec-outcome--interrupted ${className ?? ""}`}>
      <div className="audit-exec-outcome__icon-wrap" aria-hidden>
        <TriangleAlert className="audit-exec-outcome__icon" />
      </div>

      <p className="audit-exec-outcome__eyebrow">Execution stopped</p>
      <h2 className="audit-exec-outcome__title">Audit interrupted</h2>
      <Text variant="muted" className="audit-exec-outcome__description">
        {message?.trim() || AUDIT_INTERRUPTED_MESSAGE}
        {domain ? ` (${domain})` : ""}
      </Text>

      <div className="audit-exec-outcome__guidance">
        <div className="audit-exec-outcome__guidance-block">
          <p className="audit-exec-outcome__guidance-label">Common causes</p>
          <ul className="audit-exec-outcome__guidance-list">
            <li>Logout, browser close, or laptop sleep during the run</li>
            <li>Network interruption while the audit was in progress</li>
            <li>The page was refreshed before the audit finished</li>
          </ul>
        </div>
        <div className="audit-exec-outcome__guidance-block">
          <p className="audit-exec-outcome__guidance-label">What to do</p>
          <ul className="audit-exec-outcome__guidance-list">
            <li>Keep this tab open until the audit completes</li>
            <li>Use Run Again to start a fresh audit</li>
          </ul>
        </div>
      </div>

      <div className="audit-exec-outcome__actions">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden />
          Back to New Audit
        </Button>
        <Button onClick={onRetry}>
          <RefreshCw className="size-4" aria-hidden />
          Run Again
        </Button>
      </div>

      <Text variant="muted" size="sm" className="audit-exec-outcome__footnote">
        Need help?{" "}
        <Link to={ROUTES.settings} className="text-foreground/80 underline-offset-4 hover:underline">
          Contact support from Settings
        </Link>
      </Text>
    </div>
  )
}

export { AuditExecutionInterrupted }
