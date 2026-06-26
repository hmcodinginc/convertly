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

function PageFindingsSection({ pages, auditStatus }: PageFindingsSectionProps) {
  return (
    <AuditReportSection
      eyebrow="Coverage"
      title="Page findings"
      description="Per-page conversion scores and issue density across your core funnel."
    >
      {pages.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="No pages discovered"
          description={getEmptyPagesMessage(auditStatus)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pages.map((page) => (
            <Card
              key={page.id}
              className="audit-page-card app-card-metric flex flex-col gap-4 hover:translate-y-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold tracking-tight text-foreground">
                    {page.label}
                  </h3>
                  <StatusBadge label={page.status} variant={pageStatusVariant[page.status]} />
                </div>
                {page.url ? (
                  <Text variant="muted" size="sm" className="max-w-none break-all font-mono text-xs">
                    {page.url}
                  </Text>
                ) : null}
                <Text variant="muted" size="sm" className="max-w-none font-mono text-xs">
                  {page.path}
                </Text>
                {page.pageType || page.discoveryStatus ? (
                  <Text variant="muted" size="sm" className="max-w-none text-xs">
                    {[page.pageType, page.discoveryStatus].filter(Boolean).join(" · ")}
                  </Text>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-6 sm:gap-8">
                <div className="text-right">
                  <p className="text-2xl font-medium tabular-nums tracking-tight text-foreground">
                    {page.score}
                  </p>
                  <Text variant="muted" size="sm" className="mt-0.5 max-w-none text-xs">
                    Score
                  </Text>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-medium tabular-nums tracking-tight text-foreground">
                    {page.issuesCount}
                  </p>
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
