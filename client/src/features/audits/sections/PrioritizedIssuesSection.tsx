import { AlertTriangle, ChevronDown } from "lucide-react"
import { useMemo, useState } from "react"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { EmptyState } from "@/components/feedback/EmptyState"
import { AuditReportSection } from "@/features/audits/components/AuditReportSection"
import { FindingImpactBody } from "@/features/audits/presentation/FindingImpactBody"
import { groupPageIssues } from "@/features/audits/utils/groupAuditPresentation"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { isAuditInProgress } from "@/lib/auditStatus"
import type { AuditStatus, Issue, PageFinding } from "@/types/audit"
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
  pages: PageFinding[]
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

function PrioritizedIssuesSection({ issues, pages, auditStatus }: PrioritizedIssuesSectionProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(defaultExpanded)
  const groupedIssues = useMemo(() => groupPageIssues(issues, pages), [issues, pages])

  const grouped = severityOrder.map((severity) => ({
    severity,
    items: groupedIssues.filter((issue) => issue.severity === severity),
  }))

  const toggle = (severity: string) => {
    setExpanded((prev) => ({ ...prev, [severity]: !prev[severity] }))
  }

  return (
    <AuditReportSection
      eyebrow="Findings"
      title="Page issues"
      description="Page-specific conversion issues grouped by severity and finding type. Identical issues across pages are consolidated."
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
                        {items.length} {items.length === 1 ? "finding type" : "finding types"}
                        <span className="text-foreground/45"> · </span>
                        {items.reduce((sum, item) => sum + item.issueIds.length, 0)} total
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
                        <li key={issue.key} className="audit-finding-item">
                          <div className="audit-finding-item__header">
                            <h4 className="audit-finding-item__title">{issue.title}</h4>
                            {issue.affectedPages.length > 1 ? (
                              <span className="audit-finding-item__count">
                                {issue.affectedPages.length} pages
                              </span>
                            ) : null}
                          </div>
                          <FindingImpactBody
                            title={issue.title}
                            impact={issue.representativeImpact}
                            recommendation={issue.recommendation}
                            affectedPages={issue.affectedPages}
                            pageLabels={issue.pageLabels}
                          />
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
