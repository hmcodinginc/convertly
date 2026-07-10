import { Link } from "react-router-dom"

import { UsageSummaryCard } from "@/components/billing/UsageSummaryCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography/Text"
import { Card } from "@/components/surfaces/Card"
import { ROUTES } from "@/lib/routes"
import type { WorkspaceUsage } from "@/types/workspace"

type WorkspaceOverviewCardProps = {
  workspaceName: string
  usage: WorkspaceUsage
}

function WorkspaceOverviewCard({ workspaceName, usage }: WorkspaceOverviewCardProps) {
  const isInternalAccount = usage.planId === "internal"

  const billingAction =
    usage.auditsRemaining === 0 ? (
      <Button size="sm" asChild>
        <Link to={ROUTES.billing}>Upgrade to run more audits</Link>
      </Button>
    ) : (
      <Button variant="outline" size="sm" asChild>
        <Link to={ROUTES.billing}>View billing</Link>
      </Button>
    )

  return (
    <Card className="app-card-compact workspace-overview-card hover:translate-y-0">
      <div className="workspace-overview-card__header">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {workspaceName}
          </h2>
          {isInternalAccount ? (
            <StatusBadge label="Internal access" variant="accent" />
          ) : null}
        </div>
        <Text variant="muted" size="sm" className="max-w-2xl leading-5">
          Your personal workspace for domains, usage, and audit limits.
        </Text>
      </div>

      <UsageSummaryCard usage={usage} showHeading={false} footer={billingAction} />
    </Card>
  )
}

export { WorkspaceOverviewCard }
