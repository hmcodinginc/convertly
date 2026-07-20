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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

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

  const deletableFilteredIds = useMemo(
    () => filteredAudits.filter((a) => isDeletableAudit(a.id)).map((a) => a.id),
    [filteredAudits]
  )

  const allDeletableSelected =
    deletableFilteredIds.length > 0 &&
    deletableFilteredIds.every((id) => selectedIds.has(id))

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

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allDeletableSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(deletableFilteredIds))
    }
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

  async function handleBulkDelete() {
    if (selectedIds.size === 0 || isBulkDeleting) return
    setIsBulkDeleting(true)
    try {
      await Promise.all([...selectedIds].map((id) => auditService.deleteAudit(id)))
      const count = selectedIds.size
      setSelectedIds(new Set())
      setBulkDeleteOpen(false)
      showSuccess(`${count} audit${count === 1 ? "" : "s"} deleted successfully.`)
      reload()
    } finally {
      setIsBulkDeleting(false)
    }
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
            {selectedIds.size > 0 ? (
              <Button
                variant="destructive"
                size="sm"
                className="border border-[color-mix(in_srgb,#ef4444_65%,transparent)] bg-[#dc2626] hover:bg-[#b91c1c]"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="size-4" aria-hidden />
                Delete {selectedIds.size} selected
              </Button>
            ) : null}
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
                <DataTableHeaderCell className="w-10">
                  {deletableFilteredIds.length > 0 ? (
                    <input
                      type="checkbox"
                      aria-label="Select all deletable audits"
                      className="audit-table-checkbox"
                      checked={allDeletableSelected}
                      onChange={toggleSelectAll}
                    />
                  ) : null}
                </DataTableHeaderCell>
                <DataTableHeaderCell>Name</DataTableHeaderCell>
                <DataTableHeaderCell>Domain</DataTableHeaderCell>
                <DataTableHeaderCell>Date</DataTableHeaderCell>
                <DataTableHeaderCell>Score</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
              </DataTableHeadRow>
            </DataTableHead>
            <DataTableBody>
              {filteredAudits.map((audit) => {
                const deletable = isDeletableAudit(audit.id)
                const isSelected = selectedIds.has(audit.id)
                return (
                  <DataTableRow
                    key={audit.id}
                    interactive
                    tabIndex={0}
                    role="link"
                    aria-label={`Open audit report for ${audit.name}`}
                    className={cn(isSelected && "bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]")}
                    onClick={() => navigate(auditDetailPath(audit.id))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        navigate(auditDetailPath(audit.id))
                      }
                    }}
                  >
                    <DataTableCell className="w-10">
                      {deletable ? (
                        <input
                          type="checkbox"
                          aria-label={`Select ${audit.name}`}
                          className="audit-table-checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(audit.id)}
                          onClick={(event) => event.stopPropagation()}
                        />
                      ) : null}
                    </DataTableCell>
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
                  </DataTableRow>
                )
              })}
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

      <DeleteAuditModal
        open={bulkDeleteOpen}
        audit={null}
        onClose={() => !isBulkDeleting && setBulkDeleteOpen(false)}
        onConfirmDelete={handleBulkDelete}
        title={`Delete ${selectedIds.size} audit${selectedIds.size === 1 ? "" : "s"}`}
        description={`This permanently removes ${selectedIds.size} audit${selectedIds.size === 1 ? "" : "s"} and all related data.`}
        confirmLabel={
          isBulkDeleting
            ? "Deleting…"
            : `Delete ${selectedIds.size} audit${selectedIds.size === 1 ? "" : "s"}`
        }
      />
    </AppPageShell>
  )
}

export default AuditsPage
