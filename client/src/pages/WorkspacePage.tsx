import { useState } from "react"
import { Link } from "react-router-dom"

import { BusinessFoundationRequired } from "@/components/business/BusinessFoundationRequired"
import { DomainDialog } from "@/components/workspace/DomainDialog"
import { DomainTable } from "@/components/workspace/DomainTable"
import { WorkspaceOverviewCard } from "@/components/workspace/WorkspaceOverviewCard"
import { PageError, PageLoading } from "@/components/feedback/PageState"
import { AppPageHeader } from "@/components/layout/AppPageHeader"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { Card } from "@/components/surfaces/Card"
import { Button } from "@/components/ui/button"
import { useAuthSession } from "@/hooks/useAuthSession"
import { useAsyncData } from "@/hooks/useAsyncData"
import { isBusinessFoundationEnabled } from "@/lib/businessFoundation"
import { buildWorkspaceAuditUsageBreakdown } from "@/lib/workspaceAuditUsage"
import { ROUTES } from "@/lib/routes"
import * as auditService from "@/services/auditService"
import * as workspaceService from "@/services/workspaceService"
import { formatAuditDateTime } from "@/lib/formatAuditDateTime"

import type { WorkspaceSnapshot } from "@/types/workspace"
import type { WorkspaceAuditUsageBreakdown } from "@/types/workspaceUsageBreakdown"

type WorkspacePageData = WorkspaceSnapshot & {
  usageBreakdown: WorkspaceAuditUsageBreakdown
}

async function loadWorkspacePage(userId: string): Promise<WorkspacePageData> {
  const [workspace, sessions, consumedSnapshots] = await Promise.all([
    workspaceService.getWorkspace(userId),
    auditService.getAuditLedgerSourceSessions(),
    auditService.getAuditEntitlementLedgerSnapshots(),
  ])

  return {
    ...workspace,
    usageBreakdown: buildWorkspaceAuditUsageBreakdown(
      sessions,
      workspace.usage,
      consumedSnapshots
    ),
  }
}

function WorkspacePage() {
  const { session } = useAuthSession()
  const userId = session?.userId ?? ""
  const [domainDialogOpen, setDomainDialogOpen] = useState(false)

  const { data, isLoading, isError, error, reload } = useAsyncData(
    () => loadWorkspacePage(userId),
    [userId],
    { enabled: Boolean(userId) && isBusinessFoundationEnabled() }
  )

  const header = (
    <AppPageHeader
      eyebrow="Organization"
      title="Workspace"
      description="Your personal workspace for domains, plan usage, and audit limits."
    />
  )

  if (!isBusinessFoundationEnabled()) {
    return (
      <AppPageShell header={header}>
        <BusinessFoundationRequired />
      </AppPageShell>
    )
  }

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

  async function handleAddDomain(hostname: string) {
    await workspaceService.addDomain(userId, { hostname })
    reload()
  }

  async function handleSetPrimary(domainId: string) {
    await workspaceService.updateDomain(userId, domainId, { isPrimary: true })
    reload()
  }

  async function handleDeleteDomain(domainId: string) {
    await workspaceService.removeDomain(userId, domainId)
    reload()
  }

  return (
    <AppPageShell header={header} sectionsClassName="gap-6">
      <WorkspaceOverviewCard
        workspaceName={data.name}
        usage={data.usage}
        usageBreakdown={data.usageBreakdown}
      />

      <Card className="app-card-table hover:translate-y-0">
        <div className="app-card-table-header">
          <SectionHeader
            variant="app"
            title="Domains"
            description="Properties included in your workspace monitoring."
          />
        </div>
        <DomainTable
          domains={data.domains}
          onAdd={() => setDomainDialogOpen(true)}
          onSetPrimary={(id) => void handleSetPrimary(id)}
          onDelete={(id) => void handleDeleteDomain(id)}
          formatLastAudited={(value) => formatAuditDateTime(value)}
        />
      </Card>

      <div className="app-button-row">
        <Button variant="outline" size="sm" asChild>
          <Link to={ROUTES.settings}>Account settings</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={ROUTES.billing}>Billing & upgrades</Link>
        </Button>
      </div>

      <DomainDialog
        open={domainDialogOpen}
        onClose={() => setDomainDialogOpen(false)}
        onSubmit={handleAddDomain}
      />
    </AppPageShell>
  )
}

export default WorkspacePage
