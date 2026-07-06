import { Link } from "react-router-dom"

import { UsageSummaryCard } from "@/components/billing/UsageSummaryCard"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { Card } from "@/components/surfaces/Card"
import { ROUTES } from "@/lib/routes"
import type { WorkspaceUsage } from "@/types/workspace"

type WorkspaceOverviewCardProps = {
  workspaceName: string
  usage: WorkspaceUsage
}

function WorkspaceOverviewCard({ workspaceName, usage }: WorkspaceOverviewCardProps) {
  return (
    <Card className="app-card-body app-card-stack hover:translate-y-0">
      <SectionHeader
        variant="app"
        title={workspaceName}
        description="Your personal workspace for domains, usage, and audit limits."
      />
      <UsageSummaryCard
        usage={usage}
        planName={usage.planName}
      />
      {usage.auditsRemaining === 0 ? (
        <Button size="sm" asChild>
          <Link to={ROUTES.billing}>Upgrade to run more audits</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" asChild>
          <Link to={ROUTES.billing}>View billing</Link>
        </Button>
      )}
    </Card>
  )
}

export { WorkspaceOverviewCard }
