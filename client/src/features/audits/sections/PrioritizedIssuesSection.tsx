import { AlertTriangle, ChevronDown } from "lucide-react"
import { useState } from "react"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { EmptyState } from "@/components/feedback/EmptyState"
import { AuditReportSection } from "@/features/audits/components/AuditReportSection"
import { parseImpactForDisplay } from "@/features/audits/utils/impactDisplay"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { isAuditInProgress } from "@/lib/auditStatus"
import type { AuditStatus, Issue } from "@/types/audit"
import { cn } from "@/lib/utils"

const severityOrder = ["Critical", "High", "Medium", "Low"] as const

const severityVariant = {
  Critical: "danger",
  High: "warning",
  Medium: "neutral",
  Low: "neutral",
} as const

const defaultExpanded: Record<string, boolean> = {
  Critical: true,
  High: true,
  Medium: false,
  Low: false,
}

type PrioritizedIssuesSectionProps = {
  issues: Issue[]
  auditStatus: AuditStatus
}

function getEmptyIssuesMessage(status: AuditStatus): string {
  if (isAuditInProgress(status)) {
    return "This audit is still running. Issues will appear here when the scan completes."
  }

  if (status === "failed") {
    return "No findings were recorded before this audit failed."
  }

  return "No page-specific conversion issues were detected in this audit."
}

function FindingImpactBody({ impact, page }: { impact: string; page?: string }) {
  const parsed = parseImpactForDisplay(impact)
  const affectedPage = page ?? parsed.pageFromImpact

  return (
    <div className="audit-finding-item__body">
      {affectedPage ? (
        <div className="audit-finding-item__field">
          <span className="audit-finding-item__field-label">Affected page</span>
          <code className="audit-finding-item__path">{affectedPage}</code>
        </div>
      ) : null}

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

function PrioritizedIssuesSection({ issues, auditStatus }: PrioritizedIssuesSectionProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(defaultExpanded)

  const grouped = severityOrder.map((severity) => ({
    severity,
    items: issues.filter((issue) => issue.severity === severity),
  }))

  const toggle = (severity: string) => {
    setExpanded((prev) => ({ ...prev, [severity]: !prev[severity] }))
  }

  return (
    <AuditReportSection
      eyebrow="Findings"
      title="Page issues"
      description="Page-specific conversion issues grouped by severity. Expand each group to review evidence and affected paths."
    >
      {issues.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No issues detected"
          description={getEmptyIssuesMessage(auditStatus)}
        />
      ) : (
        <div className="audit-finding-groups flex flex-col gap-3">
          {grouped.map(
            ({ severity, items }) =>
              items.length > 0 && (
                <Card key={severity} className="audit-finding-group app-card-table hover:translate-y-0">
                  <button
                    type="button"
                    onClick={() => toggle(severity)}
                    className="audit-finding-accordion-trigger flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--surface)_40%,transparent)]"
                    aria-expanded={expanded[severity]}
                  >
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                      <StatusBadge label={severity} variant={severityVariant[severity]} />
                      <Text size="sm" className="max-w-none text-muted">
                        {items.length} {items.length === 1 ? "issue" : "issues"}
                      </Text>
                    </div>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-foreground/50 transition-transform duration-[var(--motion-fast)]",
                        expanded[severity] && "rotate-180"
                      )}
                      aria-hidden
                    />
                  </button>
                  {expanded[severity] ? (
                    <ul className="audit-finding-group__list border-t border-[color-mix(in_srgb,var(--border)_55%,transparent)]">
                      {items.map((issue) => (
                        <li key={issue.id} className="audit-finding-item">
                          <h4 className="audit-finding-item__title">{issue.issue}</h4>
                          <FindingImpactBody impact={issue.impact} page={issue.page} />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </Card>
              )
          )}
        </div>
      )}
    </AuditReportSection>
  )
}

export { PrioritizedIssuesSection }
