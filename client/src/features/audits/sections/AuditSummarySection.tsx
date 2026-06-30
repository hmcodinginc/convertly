import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { AuditStatusBadge } from "@/components/audit/AuditStatusBadge"
import { AppPageSection } from "@/components/layout/AppPageSection"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import type { AuditDetail } from "@/types/audit"
import { cn } from "@/lib/utils"

type AuditSummarySectionProps = {
  audit: AuditDetail
}

function AuditSummarySection({ audit }: AuditSummarySectionProps) {
  const showScoreComparison = audit.previousScore !== 0 || audit.scoreDelta !== 0
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

  const headerDate = audit.completedAtDate ?? audit.createdAt ?? audit.completedAt

  const metrics = [
    {
      label: "Overall score",
      value: String(audit.overallScore),
      hint: "Growth score",
    },
    {
      label: "Pages analyzed",
      value: String(audit.pagesAnalyzed),
      hint: "Discovered pages",
    },
    {
      label: "Total findings",
      value: String(audit.stats.totalFindings),
      hint: `${audit.stats.pageFindingsCount} page · ${audit.stats.siteFindingsCount} site`,
    },
    {
      label: "Recommendations",
      value: String(audit.stats.totalRecommendations),
      hint: "Prioritized actions",
    },
  ]

  return (
    <AppPageSection
      eyebrow="Results"
      title="Audit summary"
      description="Key metrics and scope for this conversion audit."
    >
      <Card className="audit-summary-overview app-card-metric hover:translate-y-0">
        <dl className="audit-summary-overview__grid">
          <div className="audit-summary-overview__item">
            <dt className="audit-summary-overview__label">Website URL</dt>
            <dd className="audit-summary-overview__value audit-summary-overview__value--mono">
              {audit.websiteUrl ?? audit.domain}
            </dd>
          </div>
          <div className="audit-summary-overview__item">
            <dt className="audit-summary-overview__label">Domain</dt>
            <dd className="audit-summary-overview__value audit-summary-overview__value--mono">
              {audit.domain}
            </dd>
          </div>
          <div className="audit-summary-overview__item">
            <dt className="audit-summary-overview__label">Status</dt>
            <dd className="audit-summary-overview__value">
              <AuditStatusBadge status={audit.status} />
            </dd>
          </div>
          <div className="audit-summary-overview__item">
            <dt className="audit-summary-overview__label">Audit date</dt>
            <dd className="audit-summary-overview__value">{headerDate}</dd>
          </div>
        </dl>
      </Card>

      <div className="audit-summary-metrics grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="audit-summary-metric app-card-metric hover:translate-y-0">
            <Text variant="muted" size="sm" className="max-w-none font-medium">
              {metric.label}
            </Text>
            <p className="audit-summary-metric__value">{metric.value}</p>
            <Text variant="muted" size="sm" className="mt-1 max-w-none text-xs">
              {metric.hint}
            </Text>
          </Card>
        ))}
      </div>

      {showScoreComparison ? (
        <div className="audit-report-summary-grid audit-report-summary-grid--with-comparison">
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
        </div>
      ) : null}
    </AppPageSection>
  )
}

export { AuditSummarySection }
