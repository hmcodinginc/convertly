import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import type { ReactNode } from "react"

import { AuditStatusBadge } from "@/components/audit/AuditStatusBadge"
import { AuditConfidenceExplanation } from "@/features/audits/components/AuditConfidenceExplanation"
import { getConfidenceDisplayLabel } from "@/features/audits/utils/confidencePresentation"
import { Text } from "@/components/ui/typography/Text"
import type { AuditDetail } from "@/types/audit"
import { cn } from "@/lib/utils"

type AuditReportHeroProps = {
  audit: AuditDetail
  actions?: ReactNode
}

function AuditReportHero({ audit, actions }: AuditReportHeroProps) {
  const headerDate = audit.completedAtDate ?? audit.createdAt ?? audit.completedAt
  const explanation = audit.runMetadata.reportScoreExplanation
  const meta = audit.runMetadata
  const confidenceLabel = getConfidenceDisplayLabel(meta)

  const showScoreComparison = audit.previousScore !== 0 || audit.scoreDelta !== 0
  const deltaPositive = audit.scoreDelta > 0
  const deltaNegative = audit.scoreDelta < 0
  const DeltaIcon = deltaPositive ? ArrowUpRight : deltaNegative ? ArrowDownRight : Minus

  const deltaLabel =
    audit.scoreDelta === 0
      ? "No change"
      : `${audit.scoreDelta > 0 ? "+" : ""}${audit.scoreDelta} pts`

  return (
    <header className="audit-report-hero audit-report-hero--premium">
      <div className="audit-report-hero__content">
        <div className="audit-report-hero__eyebrow">
          <Text
            variant="muted"
            size="sm"
            className="max-w-none font-medium tracking-[0.18em] uppercase"
          >
            Audit report
          </Text>
          <AuditStatusBadge status={audit.status} />
        </div>

        <h1 className="audit-report-hero__title">{audit.domain}</h1>

        <p className="audit-report-hero__meta">
          <span>{audit.websiteUrl ?? audit.domain}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{headerDate}</span>
          <span aria-hidden>·</span>
          <span>
            {audit.pagesAnalyzed} page{audit.pagesAnalyzed === 1 ? "" : "s"} analyzed
          </span>
        </p>

        <div className="audit-report-hero__chips" role="list" aria-label="Audit highlights">
          <span className="audit-report-hero__chip" role="listitem">
            {audit.stats.totalFindings} finding{audit.stats.totalFindings === 1 ? "" : "s"}
          </span>
          {audit.recommendations.length > 0 ? (
            <span className="audit-report-hero__chip" role="listitem">
              {audit.recommendations.length} recommendation
              {audit.recommendations.length === 1 ? "" : "s"}
            </span>
          ) : null}
          {meta.auditConfidence != null ? (
            <span className="audit-report-hero__chip" role="listitem">
              {meta.auditConfidence}% confidence
              {confidenceLabel ? ` · ${confidenceLabel}` : ""}
            </span>
          ) : null}
          {typeof meta.recoverablePoints === "number" && meta.recoverablePoints > 0 ? (
            <span className="audit-report-hero__chip audit-report-hero__chip--positive" role="listitem">
              +{meta.recoverablePoints} pts recoverable
            </span>
          ) : null}
          {showScoreComparison ? (
            <span
              className={cn(
                "audit-report-hero__chip audit-report-hero__chip--delta",
                deltaPositive && "audit-report-hero__chip--positive",
                deltaNegative && "audit-report-hero__chip--negative"
              )}
              role="listitem"
            >
              <DeltaIcon className="size-3.5 shrink-0" aria-hidden />
              {deltaLabel} vs prior audit
            </span>
          ) : null}
        </div>

        {meta.auditConfidence != null ? (
          <AuditConfidenceExplanation metadata={meta} className="audit-report-hero__confidence" />
        ) : null}
      </div>

      <div className="audit-report-hero__aside">
        <div
          className="audit-report-score-panel audit-report-score-panel--premium"
          aria-label={`Growth score ${audit.overallScore}`}
        >
          <p className="audit-report-score-panel__value">{audit.overallScore}</p>
          <p className="audit-report-score-panel__label">Growth Score</p>
          <p className="audit-report-score-panel__hint">
            Measures conversion readiness and weighted business impact — not issue count alone.
          </p>
          {explanation?.scoreBand ? (
            <p className="audit-report-score-panel__band">{explanation.scoreBand}</p>
          ) : null}
          {typeof meta.growthPotential === "number" ? (
            <p className="audit-report-score-panel__potential">
              Potential {meta.growthPotential}
              {typeof meta.scoreCeiling === "number" && meta.scoreCeiling < 94
                ? ` · ceiling ${meta.scoreCeiling}`
                : ""}
            </p>
          ) : null}
        </div>
        {actions ? <div className="audit-report-hero__actions">{actions}</div> : null}
      </div>
    </header>
  )
}

export { AuditReportHero }
