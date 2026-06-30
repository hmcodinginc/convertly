import { FileSearch } from "lucide-react"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { EmptyState } from "@/components/feedback/EmptyState"
import { AuditReportSection } from "@/features/audits/components/AuditReportSection"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { isAuditInProgress } from "@/lib/auditStatus"
import type { AuditStatus, PageFinding } from "@/types/audit"

const pageStatusVariant = {
  Healthy: "success",
  "At risk": "warning",
  Critical: "danger",
} as const

type PageFindingsSectionProps = {
  pages: PageFinding[]
  auditStatus: AuditStatus
}

function getEmptyPagesMessage(status: AuditStatus): string {
  if (isAuditInProgress(status)) {
    return "Pages will appear here once discovery completes."
  }

  if (status === "failed") {
    return "No pages were discovered before this audit failed."
  }

  return "No pages were discovered for this audit."
}

function SeverityChips({
  breakdown,
}: {
  breakdown: NonNullable<PageFinding["severityBreakdown"]>
}) {
  const items = [
    { key: "critical", label: "Critical", count: breakdown.critical },
    { key: "high", label: "High", count: breakdown.high },
    { key: "medium", label: "Medium", count: breakdown.medium },
    { key: "low", label: "Low", count: breakdown.low },
  ].filter((item) => item.count > 0)

  if (items.length === 0) return null

  return (
    <div className="audit-page-card__severity">
      {items.map((item) => (
        <span key={item.key} className="audit-page-card__severity-chip">
          {item.label} {item.count}
        </span>
      ))}
    </div>
  )
}

function PageFindingsSection({ pages, auditStatus }: PageFindingsSectionProps) {
  return (
    <AuditReportSection
      eyebrow="Coverage"
      title="Page analysis"
      description="Per-page conversion scores, reachability, and finding density across your core funnel."
    >
      {pages.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="No pages discovered"
          description={getEmptyPagesMessage(auditStatus)}
        />
      ) : (
        <div className="audit-page-grid grid gap-4 sm:grid-cols-2">
          {pages.map((page) => (
            <Card
              key={page.id}
              className="audit-page-card app-card-metric hover:translate-y-0"
            >
              <div className="audit-page-card__main min-w-0">
                <div className="audit-page-card__header">
                  <h3 className="audit-page-card__title">{page.label}</h3>
                  <StatusBadge label={page.status} variant={pageStatusVariant[page.status]} />
                </div>
                {page.url ? (
                  <p className="audit-page-card__url">{page.url}</p>
                ) : null}
                <p className="audit-page-card__path">{page.path}</p>
                <div className="audit-page-card__meta-row">
                  {page.pageType ? (
                    <span className="audit-page-card__meta-chip">{page.pageType}</span>
                  ) : null}
                  {page.discoveryStatus ? (
                    <span className="audit-page-card__meta-chip">{page.discoveryStatus}</span>
                  ) : null}
                </div>
                {page.severityBreakdown ? (
                  <SeverityChips breakdown={page.severityBreakdown} />
                ) : null}
                {page.categoryBreakdown && page.categoryBreakdown.length > 0 ? (
                  <p className="audit-page-card__categories">
                    {page.categoryBreakdown
                      .slice(0, 3)
                      .map((item) => `${item.category} ${item.count}`)
                      .join(" · ")}
                  </p>
                ) : null}
              </div>
              <div className="audit-page-card__stats">
                <div className="audit-page-card__stat">
                  <p className="audit-page-card__stat-value">{page.score}</p>
                  <Text variant="muted" size="sm" className="mt-0.5 max-w-none text-xs">
                    Score
                  </Text>
                </div>
                <div className="audit-page-card__stat">
                  <p className="audit-page-card__stat-value">{page.issuesCount}</p>
                  <Text variant="muted" size="sm" className="mt-0.5 max-w-none text-xs">
                    Issues
                  </Text>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AuditReportSection>
  )
}

export { PageFindingsSection }
