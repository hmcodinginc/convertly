import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { AuditReportSection } from "@/features/audits/components/AuditReportSection"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import {
  countSeverities,
  severityItems,
  SEVERITY_COLORS,
} from "@/features/audits/utils/severityPresentation"
import type { AuditDetail } from "@/types/audit"
import { cn } from "@/lib/utils"

type AuditSummarySectionProps = {
  audit: AuditDetail
}

function AuditSummarySection({ audit }: AuditSummarySectionProps) {
  const showScoreComparison = audit.previousScore !== 0 || audit.scoreDelta !== 0
  const deltaPositive = audit.scoreDelta > 0
  const deltaNegative = audit.scoreDelta < 0
  const DeltaIcon = deltaPositive ? ArrowUpRight : deltaNegative ? ArrowDownRight : Minus

  const deltaColor = deltaPositive
    ? "text-[#86efac]"
    : deltaNegative
      ? "text-[#fca5a5]"
      : "text-muted"

  const deltaLabel =
    audit.scoreDelta === 0
      ? "No change"
      : `${audit.scoreDelta > 0 ? "+" : ""}${audit.scoreDelta} pts`

  const severityCounts = countSeverities(audit.issues, audit.siteFindings)
  const severityRows = severityItems(severityCounts)
  const totalSeverityCount = severityRows.reduce((sum, row) => sum + row.count, 0)

  return (
    <AuditReportSection
      id="overview"
      eyebrow="At a glance"
      title="What happened"
      description="A quick read on audit scope, finding severity, and score movement since your last run on this domain."
    >
      <div className="audit-overview-grid">
        {severityRows.length > 0 ? (
          <Card className="audit-overview-card app-card-metric hover:translate-y-0">
            <Text variant="muted" size="sm" className="max-w-none font-medium">
              Finding severity
            </Text>
            <div
              className="audit-severity-bar"
              role="img"
              aria-label={severityRows
                .map((row) => `${row.count} ${row.severity}`)
                .join(", ")}
            >
              {severityRows.map((row) => (
                <span
                  key={row.severity}
                  className="audit-severity-bar__segment"
                  style={{
                    flexGrow: row.count,
                    backgroundColor: SEVERITY_COLORS[row.severity],
                  }}
                  title={`${row.severity}: ${row.count}`}
                />
              ))}
            </div>
            <ul className="audit-severity-legend">
              {severityRows.map((row) => (
                <li key={row.severity} className="audit-severity-legend__item">
                  <span
                    className="audit-severity-legend__dot"
                    style={{ backgroundColor: SEVERITY_COLORS[row.severity] }}
                    aria-hidden
                  />
                  <span className="audit-severity-legend__label">{row.severity}</span>
                  <span className="audit-severity-legend__count tabular-nums">{row.count}</span>
                </li>
              ))}
            </ul>
            <Text variant="muted" size="sm" className="mt-3 max-w-none text-xs">
              {totalSeverityCount} total across page and site-wide findings
            </Text>
          </Card>
        ) : null}

        <Card className="audit-overview-card app-card-metric hover:translate-y-0">
          <Text variant="muted" size="sm" className="max-w-none font-medium">
            Coverage
          </Text>
          <dl className="audit-overview-stats">
            <div className="audit-overview-stats__row">
              <dt>Pages analyzed</dt>
              <dd className="tabular-nums">{audit.pagesAnalyzed}</dd>
            </div>
            <div className="audit-overview-stats__row">
              <dt>Page findings</dt>
              <dd className="tabular-nums">{audit.stats.pageFindingsCount}</dd>
            </div>
            <div className="audit-overview-stats__row">
              <dt>Site findings</dt>
              <dd className="tabular-nums">{audit.stats.siteFindingsCount}</dd>
            </div>
            <div className="audit-overview-stats__row">
              <dt>Recommendations</dt>
              <dd className="tabular-nums">{audit.recommendations.length}</dd>
            </div>
          </dl>
        </Card>

        {showScoreComparison ? (
          <Card className="audit-overview-card app-card-metric hover:translate-y-0">
            <Text variant="muted" size="sm" className="max-w-none font-medium">
              Score movement
            </Text>
            <div className="audit-overview-comparison">
              <div className="audit-overview-comparison__item">
                <span className="audit-overview-comparison__label">Previous</span>
                <span className="audit-overview-comparison__value tabular-nums">
                  {audit.previousScore}
                </span>
              </div>
              <div className="audit-overview-comparison__item">
                <span className="audit-overview-comparison__label">Change</span>
                <span
                  className={cn(
                    "audit-overview-comparison__value audit-overview-comparison__value--delta tabular-nums",
                    deltaColor
                  )}
                >
                  <DeltaIcon className="size-4 shrink-0" aria-hidden />
                  {deltaLabel}
                </span>
              </div>
              <div className="audit-overview-comparison__item">
                <span className="audit-overview-comparison__label">Current</span>
                <span className="audit-overview-comparison__value tabular-nums">
                  {audit.overallScore}
                </span>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </AuditReportSection>
  )
}

export { AuditSummarySection }
