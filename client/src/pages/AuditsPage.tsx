import { FileSearch, Loader2, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { AuditTableLink } from "@/components/dashboard/AuditTableLink"
import { AuditStatusBadge } from "@/components/audit/AuditStatusBadge"
import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
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
import { DeleteAuditModal } from "@/features/audits/components/DeleteAuditModal"
import { useAsyncData } from "@/hooks/useAsyncData"
import {
  AUDIT_SCORE_FILTER_OPTIONS,
  AUDIT_SORT_OPTIONS,
  AUDIT_STATUS_FILTER_OPTIONS,
  exportAuditsToCsv,
  filterAudits,
  isDeletableAudit,
  type AuditScoreFilter,
  type AuditSortOption,
  type AuditStatusFilter,
} from "@/lib/auditHistoryUtils"
import { ROUTES, auditDetailPath } from "@/lib/routes"
import * as auditService from "@/services/auditService"
import type { Audit } from "@/types/audit"
import { cn } from "@/lib/utils"

function AuditsPage() {
  const navigate = useNavigate()
  const { data: audits, isLoading, isError, error, reload, isEmpty } = useAsyncData(
    () => auditService.getAudits(),
    [],
    { isEmpty: (items) => items.length === 0 }
  )

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<AuditStatusFilter>("all")
  const [scoreFilter, setScoreFilter] = useState<AuditScoreFilter>("all")
  const [sortOption, setSortOption] = useState<AuditSortOption>("newest")
  const [filterOpen, setFilterOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Audit | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const filteredAudits = useMemo(
    () =>
      filterAudits(audits ?? [], {
        searchQuery,
        statusFilter,
        scoreFilter,
        sort: sortOption,
      }),
    [audits, searchQuery, statusFilter, scoreFilter, sortOption]
  )

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== "all" ||
    scoreFilter !== "all" ||
    sortOption !== "newest"
  const showFilteredEmpty = !isEmpty && filteredAudits.length === 0

  function showSuccess(message: string) {
    setSuccessMessage(message)
    window.setTimeout(() => setSuccessMessage(null), 5000)
  }

  async function handleExport() {
    if (filteredAudits.length === 0 || isExporting) return

    setIsExporting(true)
    try {
      exportAuditsToCsv(filteredAudits)
      showSuccess(`Exported ${filteredAudits.length} audit${filteredAudits.length === 1 ? "" : "s"} to CSV.`)
    } finally {
      setIsExporting(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return

    await auditService.deleteAudit(deleteTarget.id)
    setDeleteTarget(null)
    showSuccess(`"${deleteTarget.name}" was deleted successfully.`)
    reload()
  }

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
      {successMessage ? (
        <AuthFormMessage variant="success" className="mb-4">
          {successMessage}
        </AuthFormMessage>
      ) : null}

      <div className="app-toolbar">
        <input
          type="search"
          placeholder="Search by website URL..."
          aria-label="Search audits by website URL"
          className="app-input app-input-search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        {!isEmpty ? (
          <div className="app-toolbar__actions flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-expanded={filterOpen}
              aria-pressed={hasActiveFilters}
              className={cn(hasActiveFilters && "border-[color-mix(in_srgb,var(--accent)_45%,var(--border))]")}
              onClick={() => setFilterOpen((open) => !open)}
            >
              Filter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleExport()}
              disabled={filteredAudits.length === 0 || isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Exporting…
                </>
              ) : (
                "Export"
              )}
            </Button>
          </div>
        ) : null}
      </div>

      {filterOpen && !isEmpty ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="audit-status-filter" className="text-sm text-muted-foreground">
              Status
            </label>
            <select
              id="audit-status-filter"
              className="app-input"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as AuditStatusFilter)}
            >
              {AUDIT_STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="audit-score-filter" className="text-sm text-muted-foreground">
              Score
            </label>
            <select
              id="audit-score-filter"
              className="app-input"
              value={scoreFilter}
              onChange={(event) => setScoreFilter(event.target.value as AuditScoreFilter)}
            >
              {AUDIT_SCORE_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="audit-sort-filter" className="text-sm text-muted-foreground">
              Sort
            </label>
            <select
              id="audit-sort-filter"
              className="app-input"
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value as AuditSortOption)}
            >
              {AUDIT_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {isEmpty ? (
        <EmptyState
          icon={FileSearch}
          title="No audits yet"
          description="Your audit history will appear here after you run your first conversion scan."
          action={{ label: "Create audit", to: ROUTES.auditNew }}
        />
      ) : showFilteredEmpty ? (
        <EmptyState
          icon={FileSearch}
          title="No matching audits"
          description="Try adjusting your search or status filter."
        />
      ) : (
        <Card className="app-card-table hover:translate-y-0">
          <DataTableCardHeader>
            <SectionHeader
              variant="app"
              title="All audits"
              description={
                hasActiveFilters
                  ? `${filteredAudits.length} of ${audits?.length ?? 0} audits shown`
                  : `${audits?.length ?? 0} audits in the last 30 days`
              }
            />
          </DataTableCardHeader>
          <DataTable minWidth="44rem">
            <DataTableHead>
              <DataTableHeadRow>
                <DataTableHeaderCell>Name</DataTableHeaderCell>
                <DataTableHeaderCell>Domain</DataTableHeaderCell>
                <DataTableHeaderCell>Date</DataTableHeaderCell>
                <DataTableHeaderCell>Score</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
                <DataTableHeaderCell className="w-16 text-right">Actions</DataTableHeaderCell>
              </DataTableHeadRow>
            </DataTableHead>
            <DataTableBody>
              {filteredAudits.map((audit) => (
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
                      className="relative z-[1]"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {audit.name}
                    </AuditTableLink>
                  </DataTableCell>
                  <DataTableCell className="font-mono text-xs text-foreground/80">
                    {audit.domain}
                  </DataTableCell>
                  <DataTableCell className="whitespace-nowrap text-foreground/75 tabular-nums">
                    {audit.completedAt}
                  </DataTableCell>
                  <DataTableCell className="tabular-nums">{audit.conversionScore}</DataTableCell>
                  <DataTableCell>
                    <AuditStatusBadge status={audit.status} />
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    {isDeletableAudit(audit.id) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-foreground/60 hover:text-[#f87171]"
                        aria-label={`Delete ${audit.name}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          setDeleteTarget(audit)
                        }}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    ) : null}
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </Card>
      )}

      <DeleteAuditModal
        key={deleteTarget?.id ?? "closed"}
        open={deleteTarget != null}
        audit={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirmDelete={handleConfirmDelete}
      />
    </AppPageShell>
  )
}

export default AuditsPage
