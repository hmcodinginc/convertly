import { Globe } from "lucide-react"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { EmptyState } from "@/components/feedback/EmptyState"
import { AuditReportSection } from "@/features/audits/components/AuditReportSection"
import { parseImpactForDisplay } from "@/features/audits/utils/impactDisplay"
import { Card } from "@/components/surfaces/Card"
import { isAuditInProgress } from "@/lib/auditStatus"
import type { AuditStatus, SiteFinding } from "@/types/audit"

const severityVariant = {
  Critical: "danger",
  High: "warning",
  Medium: "neutral",
  Low: "neutral",
} as const

type SiteWideFindingsSectionProps = {
  findings: SiteFinding[]
  auditStatus: AuditStatus
}

function getEmptyMessage(status: AuditStatus): string {
  if (isAuditInProgress(status)) {
    return "Site-wide checks run after all pages are analyzed. Findings will appear here when the audit completes."
  }

  if (status === "failed") {
    return "No site-wide findings were recorded before this audit failed."
  }

  return "No site-wide issues were detected. Navigation, legal, and cross-page trust checks passed."
}

function SiteFindingBody({ impact }: { impact: string }) {
  const parsed = parseImpactForDisplay(impact)

  return (
    <div className="audit-finding-item__body">
      <div className="audit-finding-item__field">
        <span className="audit-finding-item__field-label">Scope</span>
        <span className="audit-finding-item__scope">Entire site</span>
      </div>

      {parsed.evidence.length > 0 ? (
        <div className="audit-finding-item__field">
          <span className="audit-finding-item__field-label">Evidence</span>
          <dl className="audit-finding-item__evidence">
            {parsed.evidence.map((row) => (
              <div key={`${row.label}-${row.value}`} className="audit-finding-item__evidence-row">
                <dt className="audit-finding-item__evidence-label">{row.label}</dt>
                <dd className="audit-finding-item__evidence-value">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <div className="audit-finding-item__field">
          <span className="audit-finding-item__field-label">Details</span>
          <p className="audit-finding-item__text">{impact}</p>
        </div>
      )}
    </div>
  )
}

function SiteWideFindingsSection({ findings, auditStatus }: SiteWideFindingsSectionProps) {
  return (
    <AuditReportSection
      eyebrow="Site coverage"
      title="Site-wide findings"
      description="Issues that apply across the whole site — navigation gaps, missing legal pages, and cross-page trust signals."
    >
      {findings.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No site-wide issues"
          description={getEmptyMessage(auditStatus)}
        />
      ) : (
        <Card className="audit-finding-group app-card-table hover:translate-y-0">
          <ul className="audit-finding-group__list">
            {findings.map((finding) => (
              <li key={finding.id} className="audit-finding-item">
                <div className="audit-finding-item__header">
                  <StatusBadge
                    label={finding.severity}
                    variant={severityVariant[finding.severity]}
                    className="audit-finding-item__severity"
                  />
                  <h4 className="audit-finding-item__title">{finding.issue}</h4>
                </div>
                <SiteFindingBody impact={finding.impact} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </AuditReportSection>
  )
}

export { SiteWideFindingsSection }
