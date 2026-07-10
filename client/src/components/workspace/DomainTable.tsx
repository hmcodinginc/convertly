import { Trash2 } from "lucide-react"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import {
  DataTable,
  DataTableBody,
  DataTableCardFooter,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableHeadRow,
  DataTableRow,
} from "@/components/data/DataTable"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography/Text"
import type { WorkspaceDomain } from "@/types/workspace"

type DomainTableProps = {
  domains: WorkspaceDomain[]
  onAdd: () => void
  onSetPrimary: (domainId: string) => void
  onDelete: (domainId: string) => void
  formatLastAudited: (value: string | null) => string
}

function DomainTable({
  domains,
  onAdd,
  onSetPrimary,
  onDelete,
  formatLastAudited,
}: DomainTableProps) {
  return (
    <>
      <DataTable minWidth="30rem" className="domain-table">
        <DataTableHead>
          <DataTableHeadRow>
            <DataTableHeaderCell>Hostname</DataTableHeaderCell>
            <DataTableHeaderCell className="domain-table__primary-col">Primary</DataTableHeaderCell>
            <DataTableHeaderCell>Last audited</DataTableHeaderCell>
            <DataTableHeaderCell className="domain-table__actions-col">Actions</DataTableHeaderCell>
          </DataTableHeadRow>
        </DataTableHead>
        <DataTableBody>
          {domains.length === 0 ? (
            <DataTableRow>
              <DataTableCell colSpan={4} className="domain-table__empty">
                <Text variant="muted" size="sm" className="max-w-none py-3">
                  No domains yet. Add your first monitored property.
                </Text>
              </DataTableCell>
            </DataTableRow>
          ) : (
            domains.map((domain) => (
              <DataTableRow key={domain.id}>
                <DataTableCell className="domain-table__hostname font-mono text-xs text-foreground/90">
                  {domain.hostname}
                </DataTableCell>
                <DataTableCell className="domain-table__primary-col">
                  {domain.isPrimary ? (
                    <StatusBadge label="Primary" variant="accent" />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => onSetPrimary(domain.id)}
                    >
                      Set primary
                    </Button>
                  )}
                </DataTableCell>
                <DataTableCell className="domain-table__date tabular-nums text-foreground/75">
                  {formatLastAudited(domain.lastAuditedAt)}
                </DataTableCell>
                <DataTableCell className="domain-table__actions-col">
                  <div className="domain-table__actions">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted hover:text-[#fca5a5]"
                      aria-label={`Remove ${domain.hostname}`}
                      onClick={() => onDelete(domain.id)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </DataTableCell>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTable>
      <DataTableCardFooter>
        <Button variant="outline" size="sm" onClick={onAdd}>
          Add domain
        </Button>
      </DataTableCardFooter>
    </>
  )
}

export { DomainTable }
