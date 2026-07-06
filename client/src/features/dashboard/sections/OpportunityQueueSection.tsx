import { ListFilter } from "lucide-react"
import { Link } from "react-router-dom"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableHeadRow,
  DataTableRow,
} from "@/components/data/DataTable"
import { EmptyState } from "@/components/feedback/EmptyState"
import { Button } from "@/components/ui/button"
import { AppPageSection } from "@/components/layout/AppPageSection"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { ROUTES, auditDetailPath } from "@/lib/routes"
import type { OpportunityItem } from "@/types/dashboard"

const impactVariant = {
  High: "danger",
  Medium: "warning",
  Low: "neutral",
} as const

const statusVariant = {
  Open: "accent",
  "In review": "warning",
  Queued: "neutral",
} as const

type OpportunityQueueSectionProps = {
  items: OpportunityItem[]
  auditDomain?: string
  auditId?: string | null
}

function OpportunityQueueSection({
  items,
  auditDomain,
  auditId,
}: OpportunityQueueSectionProps) {
  return (
    <AppPageSection
      className="dashboard-opportunity-queue"
      eyebrow="Pipeline"
      title="Opportunity queue"
      description={
        auditDomain
          ? `Showing prioritized fixes for ${auditDomain}`
          : "Prioritized fixes ranked by modeled revenue impact."
      }
      actions={
        items.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
            {auditId ? (
              <Button variant="default" size="sm" asChild>
                <Link to={auditDetailPath(auditId)}>View full report</Link>
              </Button>
            ) : null}
            <Button variant="outline" size="sm">
              Export queue
            </Button>
          </div>
        ) : null
      }
    >
      {auditDomain && items.length > 0 ? (
        <div className="dashboard-opportunity-queue__badge">
          <StatusBadge label={auditDomain} variant="accent" />
        </div>
      ) : null}
      {items.length === 0 ? (
        <EmptyState
          icon={ListFilter}
          title="No opportunities in queue"
          description={
            auditDomain
              ? `No prioritized fixes found for ${auditDomain}. Select another audit or run a new one.`
              : "Completed audits will surface prioritized conversion fixes here."
          }
          action={{ label: "Run audit", to: ROUTES.auditNew }}
        />
      ) : (
        <Card className="app-card-table hover:translate-y-0">
          <DataTable minWidth="40rem">
            <DataTableHead>
              <DataTableHeadRow>
                <DataTableHeaderCell>Page</DataTableHeaderCell>
                <DataTableHeaderCell>Issue</DataTableHeaderCell>
                <DataTableHeaderCell>Impact</DataTableHeaderCell>
                <DataTableHeaderCell>Score</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
              </DataTableHeadRow>
            </DataTableHead>
            <DataTableBody>
              {items.map((item) => (
                <DataTableRow key={item.id}>
                  <DataTableCell className="font-mono text-xs text-foreground/90">
                    {item.page}
                  </DataTableCell>
                  <DataTableCell className="max-w-xs">
                    <Text size="sm" className="max-w-none leading-6">
                      {item.issue}
                    </Text>
                  </DataTableCell>
                  <DataTableCell>
                    <StatusBadge label={item.impact} variant={impactVariant[item.impact]} />
                  </DataTableCell>
                  <DataTableCell className="font-medium tabular-nums text-foreground">
                    {item.score}
                  </DataTableCell>
                  <DataTableCell>
                    <StatusBadge label={item.status} variant={statusVariant[item.status]} />
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </Card>
      )}
    </AppPageSection>
  )
}

export { OpportunityQueueSection }
