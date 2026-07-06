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
      <DataTable minWidth="30rem">
        <DataTableHead>
          <DataTableHeadRow>
            <DataTableHeaderCell>Hostname</DataTableHeaderCell>
            <DataTableHeaderCell>Primary</DataTableHeaderCell>
            <DataTableHeaderCell>Last audited</DataTableHeaderCell>
            <DataTableHeaderCell className="w-24">Actions</DataTableHeaderCell>
          </DataTableHeadRow>
        </DataTableHead>
        <DataTableBody>
          {domains.length === 0 ? (
            <DataTableRow>
              <DataTableCell className="text-center" >
                <Text variant="muted" size="sm" className="max-w-none py-4">
                  No domains yet. Add your first monitored property.
                </Text>
              </DataTableCell>
              <DataTableCell />
              <DataTableCell />
              <DataTableCell />
            </DataTableRow>
          ) : (
            domains.map((domain) => (
              <DataTableRow key={domain.id}>
                <DataTableCell className="font-mono text-xs text-foreground/90">
                  {domain.hostname}
                </DataTableCell>
                <DataTableCell>
                  {domain.isPrimary ? (
                    <StatusBadge label="Primary" variant="accent" />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => onSetPrimary(domain.id)}
                    >
                      Set primary
                    </Button>
                  )}
                </DataTableCell>
                <DataTableCell className="text-foreground/75">
                  {formatLastAudited(domain.lastAuditedAt)}
                </DataTableCell>
                <DataTableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted hover:text-[#fca5a5]"
                    aria-label={`Remove ${domain.hostname}`}
                    onClick={() => onDelete(domain.id)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
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
