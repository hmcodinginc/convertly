import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { AuditReportSection } from "@/features/audits/components/AuditReportSection"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import type { PageFinding } from "@/types/audit"

const pageStatusVariant = {
  Healthy: "success",
  "At risk": "warning",
  Critical: "danger",
} as const

type PageFindingsSectionProps = {
  pages: PageFinding[]
}

function PageFindingsSection({ pages }: PageFindingsSectionProps) {
  return (
    <AuditReportSection
      eyebrow="Coverage"
      title="Page findings"
      description="Per-page conversion scores and issue density across your core funnel."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {pages.map((page) => (
          <Card
            key={page.id}
            className="app-card-metric flex flex-col gap-4 hover:translate-y-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  {page.label}
                </h3>
                <StatusBadge label={page.status} variant={pageStatusVariant[page.status]} />
              </div>
              <Text variant="muted" size="sm" className="max-w-none font-mono text-xs">
                {page.path}
              </Text>
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
    </AuditReportSection>
  )
}

export { PageFindingsSection }
