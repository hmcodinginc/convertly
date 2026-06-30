import { Globe } from "lucide-react"
import { useMemo } from "react"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { EmptyState } from "@/components/feedback/EmptyState"
import { AuditReportSection } from "@/features/audits/components/AuditReportSection"
import { FindingImpactBody } from "@/features/audits/presentation/FindingImpactBody"
import { groupSiteFindings } from "@/features/audits/utils/groupAuditPresentation"
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

function SiteWideFindingsSection({ findings, auditStatus }: SiteWideFindingsSectionProps) {
  const groupedFindings = useMemo(() => groupSiteFindings(findings), [findings])

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
            {groupedFindings.map((finding) => (
              <li key={finding.key} className="audit-finding-item">
                <div className="audit-finding-item__header">
                  <StatusBadge
                    label={finding.severity}
                    variant={severityVariant[finding.severity]}
                    className="audit-finding-item__severity"
                  />
                  <h4 className="audit-finding-item__title">{finding.title}</h4>
                </div>
                <FindingImpactBody
                  title={finding.title}
                  impact={finding.representativeImpact}
                  recommendation={finding.recommendation}
                  scope="site"
                />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </AuditReportSection>
  )
}

export { SiteWideFindingsSection }
