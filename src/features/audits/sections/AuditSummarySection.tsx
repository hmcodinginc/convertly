import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { AppPageSection } from "@/components/layout/AppPageSection"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import type { AuditDetail } from "@/types/audit"
import { cn } from "@/lib/utils"

type AuditSummarySectionProps = {
  audit: AuditDetail
}

function AuditSummarySection({ audit }: AuditSummarySectionProps) {
  const deltaPositive = audit.scoreDelta > 0
  const deltaNegative = audit.scoreDelta < 0
  const DeltaIcon = deltaPositive
    ? ArrowUpRight
    : deltaNegative
      ? ArrowDownRight
      : Minus

  const deltaColor = deltaPositive
    ? "text-[#86efac]"
    : deltaNegative
      ? "text-[#fca5a5]"
      : "text-muted"

  const deltaLabel =
    audit.scoreDelta === 0
      ? "No change"
      : `${audit.scoreDelta > 0 ? "+" : ""}${audit.scoreDelta} pts`

  return (
    <AppPageSection
      eyebrow="Results"
      title="Audit summary"
      description="Conversion health snapshot for this audit run."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="app-card-metric hover:translate-y-0">
          <Text variant="muted" size="sm" className="max-w-none font-medium">
            Overall score
          </Text>
          <p className="mt-3 text-3xl font-medium tracking-tight tabular-nums text-foreground">
            {audit.overallScore}
          </p>
        </Card>
        <Card className="app-card-metric hover:translate-y-0">
          <Text variant="muted" size="sm" className="max-w-none font-medium">
            Previous score
          </Text>
          <p className="mt-3 text-3xl font-medium tracking-tight tabular-nums text-foreground/85">
            {audit.previousScore}
          </p>
        </Card>
        <Card className="app-card-metric hover:translate-y-0">
          <Text variant="muted" size="sm" className="max-w-none font-medium">
            Score delta
          </Text>
          <p
            className={cn(
              "mt-3 flex items-center gap-1 text-3xl font-medium tracking-tight tabular-nums",
              deltaColor
            )}
          >
            <DeltaIcon className="size-5 shrink-0" aria-hidden />
            {deltaLabel}
          </p>
        </Card>
        <Card className="app-card-metric hover:translate-y-0">
          <Text variant="muted" size="sm" className="max-w-none font-medium">
            Pages scanned
          </Text>
          <p className="mt-3 text-3xl font-medium tracking-tight tabular-nums text-foreground">
            {audit.pagesAnalyzed}
          </p>
        </Card>
      </div>
    </AppPageSection>
  )
}

export { AuditSummarySection }
