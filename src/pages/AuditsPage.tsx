import { FileSearch } from "lucide-react"
import { Link } from "react-router-dom"

import { AuditTableLink } from "@/components/dashboard/AuditTableLink"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import {
  DataTable,
  DataTableBody,
  DataTableCardHeader,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableHeadRow,
  DataTableRow,
} from "@/components/data/DataTable"
import { EmptyState } from "@/components/feedback/EmptyState"
import { PageError, PageLoading } from "@/components/feedback/PageState"
import { Button } from "@/components/ui/button"
import { AppPageHeader } from "@/components/layout/AppPageHeader"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { Card } from "@/components/surfaces/Card"
import { useAsyncData } from "@/hooks/useAsyncData"
import { ROUTES } from "@/lib/routes"
import * as auditService from "@/services/auditService"

const auditStatusVariant = {
  Completed: "success",
  Running: "accent",
  Scheduled: "neutral",
} as const

function AuditsPage() {
  const { data: audits, isLoading, isError, error, reload, isEmpty } = useAsyncData(
    () => auditService.getAudits(),
    [],
    { isEmpty: (items) => items.length === 0 }
  )

  const header = (
    <AppPageHeader
      eyebrow="History"
      title="Audit history"
      description="Browse completed and in-progress audits across your workspace."
      actions={
        <Button size="sm" asChild>
          <Link to={ROUTES.auditNew}>New audit</Link>
        </Button>
      }
    />
  )

  if (isLoading) {
    return (
      <AppPageShell header={header}>
        <PageLoading label="Loading audits…" />
      </AppPageShell>
    )
  }

  if (isError) {
    return (
      <AppPageShell header={header}>
        <PageError description={error ?? undefined} onRetry={reload} />
      </AppPageShell>
    )
  }

  return (
    <AppPageShell header={header}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Search audits..."
          aria-label="Search audits"
          className="h-9 w-full max-w-sm rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_90%,transparent)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] px-3 text-sm outline-none focus:border-[color-mix(in_srgb,var(--accent)_45%,var(--border))]"
        />
        {!isEmpty ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Filter
            </Button>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
        ) : null}
      </div>

      {isEmpty ? (
        <EmptyState
          icon={FileSearch}
          title="No audits yet"
          description="Your audit history will appear here after you run your first conversion scan."
          action={{ label: "Create audit", to: ROUTES.auditNew }}
        />
      ) : (
        <Card className="app-card-table hover:translate-y-0">
          <DataTableCardHeader>
            <SectionHeader
              variant="app"
              title="All audits"
              description={`${audits?.length ?? 0} audits in the last 30 days`}
            />
          </DataTableCardHeader>
          <DataTable minWidth="40rem">
            <DataTableHead>
              <DataTableHeadRow>
                <DataTableHeaderCell>Name</DataTableHeaderCell>
                <DataTableHeaderCell>Domain</DataTableHeaderCell>
                <DataTableHeaderCell>Date</DataTableHeaderCell>
                <DataTableHeaderCell>Score</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
              </DataTableHeadRow>
            </DataTableHead>
            <DataTableBody>
              {audits?.map((audit) => (
                <DataTableRow key={audit.id}>
                  <DataTableCell>
                    <AuditTableLink auditId={audit.id}>{audit.name}</AuditTableLink>
                  </DataTableCell>
                  <DataTableCell className="font-mono text-xs text-foreground/80">
                    {audit.domain}
                  </DataTableCell>
                  <DataTableCell className="text-foreground/75">
                    {audit.completedAt}
                  </DataTableCell>
                  <DataTableCell className="tabular-nums">{audit.conversionScore}</DataTableCell>
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
    </AppPageShell>
  )
}

export default AuditsPage
