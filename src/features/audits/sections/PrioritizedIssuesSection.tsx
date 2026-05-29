import { AlertTriangle, ChevronDown } from "lucide-react"
import { useState } from "react"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { EmptyState } from "@/components/feedback/EmptyState"
import { AuditReportSection } from "@/features/audits/components/AuditReportSection"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import type { Issue } from "@/types/audit"
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
}

function PrioritizedIssuesSection({ issues }: PrioritizedIssuesSectionProps) {
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
      title="Issue prioritization"
      description="Conversion issues grouped by severity. Expand each group to review impact and affected pages."
    >
      {issues.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No issues detected yet"
          description="This audit is still running. Issues will appear here when the scan completes."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {grouped.map(
            ({ severity, items }) =>
              items.length > 0 && (
                <Card key={severity} className="app-card-table hover:translate-y-0">
                  <button
                    type="button"
                    onClick={() => toggle(severity)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--surface)_40%,transparent)]"
                    aria-expanded={expanded[severity]}
                  >
                    <div className="flex items-center gap-3">
                      <StatusBadge label={severity} variant={severityVariant[severity]} />
                      <Text size="sm" className="max-w-none text-muted">
                        {items.length} {items.length === 1 ? "issue" : "issues"}
                      </Text>
                    </div>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-foreground/50",
                        expanded[severity] && "rotate-180"
                      )}
                      aria-hidden
                    />
                  </button>
                  {expanded[severity] ? (
                    <ul className="border-t border-[color-mix(in_srgb,var(--border)_55%,transparent)]">
                      {items.map((issue, index) => (
                        <li
                          key={issue.id}
                          className={cn(
                            "px-5 py-3",
                            index < items.length - 1 &&
                              "border-b border-[color-mix(in_srgb,var(--border)_45%,transparent)]"
                          )}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                            <div className="min-w-0 space-y-1">
                              <Text size="sm" className="max-w-none leading-6 font-medium">
                                {issue.issue}
                              </Text>
                              {issue.page ? (
                                <Text
                                  variant="muted"
                                  size="sm"
                                  className="max-w-none font-mono text-xs"
                                >
                                  {issue.page}
                                </Text>
                              ) : null}
                            </div>
                            <Text
                              size="sm"
                              className="max-w-none shrink-0 text-foreground/75 sm:text-right"
                            >
                              {issue.impact}
                            </Text>
                          </div>
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
