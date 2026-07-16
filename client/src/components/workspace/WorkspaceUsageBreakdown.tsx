import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableHeadRow,
  DataTableRow,
} from "@/components/data/DataTable"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { Text } from "@/components/ui/typography/Text"
import {
  getWorkspaceLedgerStatusVariant,
} from "@/lib/workspaceAuditUsage"
import type { WorkspaceAuditUsageBreakdown } from "@/types/workspaceUsageBreakdown"

type WorkspaceUsageBreakdownProps = {
  breakdown: WorkspaceAuditUsageBreakdown
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="usage-breakdown__row">
      <Text variant="muted" size="sm" className="max-w-none text-xs">
        {label}
      </Text>
      <Text size="sm" className="max-w-none font-medium text-foreground">
        {value}
      </Text>
    </div>
  )
}

function WorkspaceUsageBreakdown({ breakdown }: WorkspaceUsageBreakdownProps) {
  return (
    <div className="usage-breakdown">
      <Text
        variant="muted"
        size="sm"
        className="max-w-none text-xs font-medium uppercase tracking-wide"
      >
        Audit usage
      </Text>

      <div className="usage-breakdown__summary">
        <BreakdownRow
          label="Completed audits"
          value={String(breakdown.completedCount)}
        />
        <BreakdownRow
          label="Failed audits"
          value={`${breakdown.failedCount} (Not Counted)`}
        />
        <BreakdownRow
          label="Draft audits"
          value={`${breakdown.draftCount} (Not Counted)`}
        />
        <BreakdownRow label="Remaining" value={String(breakdown.remaining)} />
        <BreakdownRow
          label="Resets"
          value={breakdown.periodEndFormatted ?? "—"}
        />
      </div>

      <div className="usage-breakdown__ledger">
        <Text size="sm" className="max-w-none font-medium text-foreground">
          Audit ledger
        </Text>
        <Text variant="muted" size="sm" className="max-w-none text-xs leading-5">
          Every audit session in your workspace, including removed audits that still
          count toward usage.
        </Text>

        {breakdown.deletedCountedCount > 0 ? (
          <Text variant="muted" size="sm" className="max-w-none text-xs leading-5">
            {breakdown.deletedCountedCount} completed audit
            {breakdown.deletedCountedCount === 1 ? "" : "s"} were removed from your workspace but
            still count toward your allowance. Their details are preserved below.
          </Text>
        ) : null}

        <DataTable minWidth="40rem" className="usage-breakdown__table">
          <DataTableHead>
            <DataTableHeadRow>
              <DataTableHeaderCell>URL</DataTableHeaderCell>
              <DataTableHeaderCell>Audit type</DataTableHeaderCell>
              <DataTableHeaderCell>Created date</DataTableHeaderCell>
              <DataTableHeaderCell>Status</DataTableHeaderCell>
              <DataTableHeaderCell>Counted</DataTableHeaderCell>
            </DataTableHeadRow>
          </DataTableHead>
          <DataTableBody>
            {breakdown.ledger.length === 0 ? (
              <DataTableRow>
                <DataTableCell colSpan={5}>
                  <Text variant="muted" size="sm" className="max-w-none py-3">
                    No audits yet. Sessions will appear here as you save drafts, run
                    audits, or remove completed audits from your workspace.
                  </Text>
                </DataTableCell>
              </DataTableRow>
            ) : (
              breakdown.ledger.map((row) => (
                <DataTableRow key={row.id}>
                  <DataTableCell className="font-mono text-xs text-foreground/90">
                    {row.url}
                  </DataTableCell>
                  <DataTableCell className="text-xs">{row.auditType}</DataTableCell>
                  <DataTableCell className="text-xs text-muted">{row.createdAt}</DataTableCell>
                  <DataTableCell>
                    <StatusBadge
                      label={row.status}
                      variant={getWorkspaceLedgerStatusVariant(row.status)}
                    />
                  </DataTableCell>
                  <DataTableCell>
                    <StatusBadge
                      label={row.counted ? "Yes" : "No"}
                      variant={row.counted ? "success" : "neutral"}
                    />
                  </DataTableCell>
                </DataTableRow>
              ))
            )}
          </DataTableBody>
        </DataTable>
      </div>
    </div>
  )
}

export { WorkspaceUsageBreakdown }
