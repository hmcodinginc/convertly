import { FileSearch } from "lucide-react"
import { Link } from "react-router-dom"

import { AuditTableLink } from "@/components/dashboard/AuditTableLink"
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
import { ROUTES } from "@/lib/routes"
import type { Audit } from "@/types/audit"

const auditStatusVariant = {
  Completed: "success",
  Running: "accent",
  Scheduled: "neutral",
} as const

type RecentAuditsSectionProps = {
  audits: Audit[]
}

function RecentAuditsSection({ audits }: RecentAuditsSectionProps) {
  return (
    <AppPageSection
      eyebrow="Activity"
      title="Recent audits"
      description="Latest runs across your workspace with conversion scores."
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to={ROUTES.audits}>View all audits</Link>
        </Button>
      }
    >
      {audits.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="No audits yet"
          description="Run your first conversion audit to see scores, issues, and recommendations here."
          action={{ label: "Start first audit", to: ROUTES.auditNew }}
        />
      ) : (
        <Card className="app-card-table hover:translate-y-0">
          <DataTable minWidth="37.5rem">
            <DataTableHead>
              <DataTableHeadRow>
                <DataTableHeaderCell>Audit</DataTableHeaderCell>
                <DataTableHeaderCell>Domain</DataTableHeaderCell>
                <DataTableHeaderCell>Completed</DataTableHeaderCell>
                <DataTableHeaderCell>Pages</DataTableHeaderCell>
                <DataTableHeaderCell>Score</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
              </DataTableHeadRow>
            </DataTableHead>
            <DataTableBody>
              {audits.slice(0, 5).map((audit) => (
                <DataTableRow key={audit.id} interactive>
                  <DataTableCell>
                    <AuditTableLink auditId={audit.id}>{audit.name}</AuditTableLink>
                  </DataTableCell>
                  <DataTableCell className="font-mono text-xs text-foreground/80">
                    {audit.domain}
                  </DataTableCell>
                  <DataTableCell className="text-foreground/75">
                    {audit.completedAt}
                  </DataTableCell>
                  <DataTableCell className="tabular-nums text-foreground/85">
                    {audit.pagesScanned}
                  </DataTableCell>
                  <DataTableCell className="font-medium tabular-nums text-foreground">
                    {audit.conversionScore}
                  </DataTableCell>
                  <DataTableCell>
                    <StatusBadge
                      label={audit.status}
                      variant={auditStatusVariant[audit.status]}
                    />
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

export { RecentAuditsSection }
