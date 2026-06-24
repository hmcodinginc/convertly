import { FileSearch } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { AuditTableLink } from "@/components/dashboard/AuditTableLink"
import { AuditStatusBadge } from "@/components/audit/AuditStatusBadge"
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
import { ROUTES, auditDetailPath } from "@/lib/routes"
import type { Audit } from "@/types/audit"

type RecentAuditsSectionProps = {
  audits: Audit[]
}

function RecentAuditsSection({ audits }: RecentAuditsSectionProps) {
  const navigate = useNavigate()

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
                <DataTableRow
                  key={audit.id}
                  interactive
                  tabIndex={0}
                  role="link"
                  aria-label={`Open audit report for ${audit.name}`}
                  onClick={() => navigate(auditDetailPath(audit.id))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      navigate(auditDetailPath(audit.id))
                    }
                  }}
                >
                  <DataTableCell>
                    <AuditTableLink
                      auditId={audit.id}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {audit.name}
                    </AuditTableLink>
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
                    <AuditStatusBadge status={audit.status} />
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
