import { FileSearch } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

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
import { AppPageSection } from "@/components/layout/AppPageSection"
import { Card } from "@/components/surfaces/Card"
import { RecentAuditRowActions } from "@/features/dashboard/components/RecentAuditRowActions"
import { sortAuditsNewestFirst } from "@/features/dashboard/utils/auditDashboardView"
import { ROUTES, auditDetailPath } from "@/lib/routes"
import type { Audit } from "@/types/audit"

type RecentAuditsSectionProps = {
  audits: Audit[]
  onDeleteRequest: (audit: Audit) => void
}

function RecentAuditsSection({ audits, onDeleteRequest }: RecentAuditsSectionProps) {
  const navigate = useNavigate()
  const recentAudits = sortAuditsNewestFirst(audits).slice(0, 5)
  const hasMore = audits.length > 0

  return (
    <AppPageSection
      className="dashboard-recent-audits"
      eyebrow="Activity"
      title="Recent audits"
      description="Jump back into your latest conversion reports."
      actions={
        hasMore ? (
          <Link to={ROUTES.audits} className="dashboard-recent-audits__history-link">
            View audit history →
          </Link>
        ) : null
      }
    >
      {recentAudits.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="No audits yet"
          description="Run your first conversion audit to see scores, issues, and recommendations here."
          action={{ label: "Start first audit", to: ROUTES.auditNew }}
        />
      ) : (
        <Card className="app-card-table hover:translate-y-0">
          <DataTable minWidth="44rem" className="app-table-relaxed">
            <colgroup>
              <col />
              <col />
              <col />
              <col />
              <col />
              <col className="dashboard-recent-audits__actions-col" />
            </colgroup>
            <DataTableHead>
              <DataTableHeadRow>
                <DataTableHeaderCell>Domain</DataTableHeaderCell>
                <DataTableHeaderCell>Date</DataTableHeaderCell>
                <DataTableHeaderCell>Score</DataTableHeaderCell>
                <DataTableHeaderCell>Pages</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
                <DataTableHeaderCell className="dashboard-recent-audits__actions-header">
                  Actions
                </DataTableHeaderCell>
              </DataTableHeadRow>
            </DataTableHead>
            <DataTableBody>
              {recentAudits.map((audit) => (
                <DataTableRow
                  key={audit.id}
                  interactive
                  tabIndex={0}
                  role="link"
                  aria-label={`Open audit report for ${audit.domain}`}
                  onClick={() => navigate(auditDetailPath(audit.id))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      navigate(auditDetailPath(audit.id))
                    }
                  }}
                >
                  <DataTableCell className="font-medium text-foreground">
                    {audit.domain}
                  </DataTableCell>
                  <DataTableCell className="whitespace-nowrap text-foreground/75 tabular-nums">
                    {audit.completedAt}
                  </DataTableCell>
                  <DataTableCell className="font-medium tabular-nums text-foreground">
                    {audit.conversionScore}
                  </DataTableCell>
                  <DataTableCell className="tabular-nums text-foreground/85">
                    {audit.pagesScanned}
                  </DataTableCell>
                  <DataTableCell>
                    <AuditStatusBadge status={audit.status} />
                  </DataTableCell>
                  <DataTableCell className="dashboard-recent-audits__actions-cell">
                    <RecentAuditRowActions audit={audit} onDeleteRequest={onDeleteRequest} />
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
