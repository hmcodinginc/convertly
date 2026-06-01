import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import {
  DataTable,
  DataTableBody,
  DataTableCardFooter,
  DataTableCardHeader,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableHeadRow,
  DataTableRow,
} from "@/components/data/DataTable"
import { PageError, PageLoading } from "@/components/feedback/PageState"
import { AppPageHeader } from "@/components/layout/AppPageHeader"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { useAsyncData } from "@/hooks/useAsyncData"
import { ROUTES } from "@/lib/routes"
import * as workspaceService from "@/services/workspaceService"

const roleVariant = {
  Owner: "accent",
  Admin: "warning",
  Member: "neutral",
} as const

function WorkspacePage() {
  const { data, isLoading, isError, error, reload } = useAsyncData(
    () => workspaceService.getWorkspace(),
    []
  )

  const header = (
    <AppPageHeader
      eyebrow="Organization"
      title="Workspace"
      description="Manage company profile, domains, team access, and audit limits."
    />
  )

  if (isLoading) {
    return (
      <AppPageShell header={header}>
        <PageLoading label="Loading workspace…" />
      </AppPageShell>
    )
  }

  if (isError || !data) {
    return (
      <AppPageShell header={header}>
        <PageError description={error ?? undefined} onRetry={reload} />
      </AppPageShell>
    )
  }

  const { company, domains, team, auditLimits } = data
  const usagePercent = Math.round((auditLimits.auditsUsed / auditLimits.auditsIncluded) * 100)

  return (
    <AppPageShell header={header} sectionsClassName="gap-5">
      <Card className="app-card-body app-card-stack hover:translate-y-0">
        <SectionHeader
          variant="app"
          title="Company info"
          description="Organization details used across reports and notifications."
        />
        <dl className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Company name", value: company.name },
            { label: "Industry", value: company.industry },
            { label: "Team size", value: company.teamSize },
            { label: "Timezone", value: company.timezone },
          ].map((field) => (
            <div
              key={field.label}
              className="rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_55%,transparent)] bg-[color-mix(in_srgb,var(--surface)_50%,transparent)] px-4 py-3"
            >
              <Text variant="muted" size="sm" className="max-w-none text-xs">
                {field.label}
              </Text>
              <Text size="sm" className="mt-1 max-w-none font-medium">
                {field.value}
              </Text>
            </div>
          ))}
        </dl>
        <Button variant="outline" size="sm">
          Edit company info
        </Button>
      </Card>

      <Card className="app-card-table hover:translate-y-0">
        <DataTableCardHeader>
          <SectionHeader
            variant="app"
            title="Domains"
            description="Properties included in workspace-wide monitoring."
          />
        </DataTableCardHeader>
        <DataTable minWidth="30rem">
          <DataTableHead>
            <DataTableHeadRow>
              <DataTableHeaderCell>Hostname</DataTableHeaderCell>
              <DataTableHeaderCell>Primary</DataTableHeaderCell>
              <DataTableHeaderCell>Last audited</DataTableHeaderCell>
            </DataTableHeadRow>
          </DataTableHead>
          <DataTableBody>
            {domains.map((domain) => (
              <DataTableRow key={domain.id} interactive>
                <DataTableCell className="font-mono text-xs text-foreground/90">
                  {domain.hostname}
                </DataTableCell>
                <DataTableCell>
                  {domain.isPrimary ? (
                    <StatusBadge label="Primary" variant="accent" />
                  ) : (
                    <Text variant="muted" size="sm" className="max-w-none">
                      —
                    </Text>
                  )}
                </DataTableCell>
                <DataTableCell className="text-foreground/75">
                  {domain.lastAudited}
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
        <DataTableCardFooter>
          <Button variant="outline" size="sm">
            Add domain
          </Button>
        </DataTableCardFooter>
      </Card>

      <Card className="app-card-table hover:translate-y-0">
        <DataTableCardHeader>
          <SectionHeader
            variant="app"
            title="Team members"
            description="Users with access to audits, reports, and workspace settings."
          />
        </DataTableCardHeader>
        <DataTable minWidth="32.5rem">
          <DataTableHead>
            <DataTableHeadRow>
              <DataTableHeaderCell>Name</DataTableHeaderCell>
              <DataTableHeaderCell>Email</DataTableHeaderCell>
              <DataTableHeaderCell>Role</DataTableHeaderCell>
              <DataTableHeaderCell>Status</DataTableHeaderCell>
            </DataTableHeadRow>
          </DataTableHead>
          <DataTableBody>
            {team.map((member) => (
              <DataTableRow key={member.id} interactive>
                <DataTableCell className="font-medium text-foreground">
                  {member.name}
                </DataTableCell>
                <DataTableCell className="text-foreground/75">{member.email}</DataTableCell>
                <DataTableCell>
                  <StatusBadge label={member.role} variant={roleVariant[member.role]} />
                </DataTableCell>
                <DataTableCell>
                  <StatusBadge
                    label={member.status}
                    variant={member.status === "Active" ? "success" : "neutral"}
                  />
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
        <DataTableCardFooter>
          <Button variant="outline" size="sm">
            Invite member
          </Button>
        </DataTableCardFooter>
      </Card>

      <Card className="app-card-body app-card-stack hover:translate-y-0">
        <SectionHeader
          variant="app"
          title="Audit limits"
          description={`${auditLimits.plan} plan · ${auditLimits.retentionDays}-day retention`}
        />
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <Text size="sm" className="max-w-none font-medium">
              Audits used this period
            </Text>
            <Text variant="muted" size="sm" className="max-w-none tabular-nums">
              {auditLimits.auditsUsed} / {auditLimits.auditsIncluded}
            </Text>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--surface)_80%,transparent)]">
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <Text variant="muted" size="sm" className="max-w-none text-xs">
            Up to {auditLimits.pagesPerAudit} pages per audit · Resets monthly
          </Text>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to={ROUTES.billing}>View billing</Link>
        </Button>
      </Card>
    </AppPageShell>
  )
}

export default WorkspacePage
