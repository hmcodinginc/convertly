import { Link } from "react-router-dom"

import { AppPageSection } from "@/components/layout/AppPageSection"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { ROUTES, auditDetailPath } from "@/lib/routes"
import { computeAverageScoreTrend } from "@/services/audit/utils/auditScoreHistory"
import type { Audit, AuditDetail, Recommendation } from "@/types/audit"
import type { OpportunityItem } from "@/types/dashboard"

type DashboardPriorityInsightsProps = {
  audits: Audit[]
  selectedDetail: AuditDetail | null
  opportunities: OpportunityItem[]
  recommendations: Recommendation[]
  auditId: string | null
}

function DashboardPriorityInsights({
  audits,
  selectedDetail,
  opportunities,
  recommendations,
  auditId,
}: DashboardPriorityInsightsProps) {
  if (!selectedDetail) return null

  const topOpportunity = opportunities[0]
  const topRecommendation = recommendations[0]
  const trend = computeAverageScoreTrend(audits)
  const criticalCount =
    selectedDetail.issues.filter((issue) => issue.severity === "Critical").length +
    selectedDetail.siteFindings.filter((finding) => finding.severity === "Critical").length

  const scoreDelta = selectedDetail.scoreDelta

  return (
    <AppPageSection
      eyebrow="Priority"
      title="What matters now"
      description="Highest-impact actions from your selected audit."
    >
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          label="Biggest opportunity"
          title={topOpportunity?.issue ?? "No open opportunities"}
          detail={topOpportunity ? `${topOpportunity.page} · ${topOpportunity.impact} impact` : "Run an audit to surface issues."}
          accent="warning"
        />
        <InsightCard
          label="Highest impact recommendation"
          title={topRecommendation?.title ?? "No recommendations yet"}
          detail={topRecommendation?.estimatedLift ?? "Complete an audit to generate playbooks."}
          accent="success"
        />
        <InsightCard
          label="Score trend"
          title={trend.sampleSize > 0 ? `${trend.average} avg` : "—"}
          detail={
            trend.delta === 0
              ? `Across last ${trend.sampleSize} completed audits`
              : `${trend.delta > 0 ? "+" : ""}${trend.delta} pts vs prior ${Math.min(5, audits.length - trend.sampleSize)} audits`
          }
          accent={trend.delta >= 0 ? "success" : "danger"}
        />
        <InsightCard
          label="Critical issues"
          title={String(criticalCount)}
          detail={
            scoreDelta !== 0
              ? `${scoreDelta > 0 ? "+" : ""}${scoreDelta} pts vs previous audit on ${selectedDetail.domain}`
              : `${criticalCount === 0 ? "No critical blockers" : "Resolve critical items first"}`
          }
          accent={criticalCount > 0 ? "danger" : "neutral"}
        />
      </div>

      {auditId ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to={auditDetailPath(auditId)} className="text-sm font-medium text-foreground/75 hover:text-foreground">
            View full report →
          </Link>
          <Link to={ROUTES.auditNew} className="text-sm font-medium text-foreground/75 hover:text-foreground">
            Run new audit →
          </Link>
        </div>
      ) : null}
    </AppPageSection>
  )
}

function InsightCard({
  label,
  title,
  detail,
  accent,
}: {
  label: string
  title: string
  detail: string
  accent: "success" | "warning" | "danger" | "neutral"
}) {
  const accentClass =
    accent === "success"
      ? "text-[#86efac]"
      : accent === "warning"
        ? "text-[#fcd34d]"
        : accent === "danger"
          ? "text-[#fca5a5]"
          : "text-foreground"

  return (
    <Card className="app-card-metric hover:translate-y-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/55">{label}</p>
      <p className={`mt-2 text-lg font-semibold tracking-tight ${accentClass}`}>{title}</p>
      <Text variant="muted" size="sm" className="mt-1 max-w-none leading-relaxed">
        {detail}
      </Text>
    </Card>
  )
}

export { DashboardPriorityInsights }
