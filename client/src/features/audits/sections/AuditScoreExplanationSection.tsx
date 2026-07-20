import { AppPageSection } from "@/components/layout/AppPageSection"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import type { ReportScoreExplanation } from "@/services/audit/intelligence/reporting/reportScoreExplanation"
import type { AuditDetail } from "@/types/audit"

const CATEGORY_LABELS: Record<string, string> = {
  conversion: "Conversion",
  trust: "Trust",
  mobile: "Mobile",
  ux: "UX",
}

type AuditScoreExplanationSectionProps = {
  audit: AuditDetail
}

function AuditScoreExplanationSection({ audit }: AuditScoreExplanationSectionProps) {
  const explanation = audit.runMetadata.reportScoreExplanation
  if (!explanation) return null

  return (
    <AppPageSection
      id="insight"
      eyebrow="Score insight"
      title="Why this score"
      description="What contributed most to your Growth Score and where the biggest recovery lives."
    >
      <div className="audit-score-insight">
        <ScoreSummaryCard explanation={explanation} audit={audit} />
        <RoiCard audit={audit} explanation={explanation} />
        <BlockersCard explanation={explanation} />
        <ContributorsCard explanation={explanation} />
      </div>
    </AppPageSection>
  )
}

function ScoreSummaryCard({
  explanation,
  audit,
}: {
  explanation: ReportScoreExplanation
  audit: AuditDetail
}) {
  const ceiling = audit.runMetadata.scoreCeiling

  return (
    <Card className="audit-score-insight__summary app-card-metric hover:translate-y-0">
      <p className="audit-score-insight__eyebrow">Score band</p>
      <div className="audit-score-insight__summary-body">
        <div className="audit-score-insight__score-block">
          <p className="audit-score-insight__score">{explanation.overallScore}</p>
          <p className="audit-score-insight__band">{explanation.scoreBand}</p>
        </div>
        <div className="audit-score-insight__summary-meta">
          <p className="audit-score-insight__intent">
            Intent: {explanation.websiteIntent.replace(/-/g, " ")}
          </p>
          {typeof ceiling === "number" ? (
            <p className="audit-score-insight__ceiling">Score ceiling {ceiling}</p>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

function BlockersCard({ explanation }: { explanation: ReportScoreExplanation }) {
  const blockers = explanation.majorDeductions.slice(0, 4)
  if (blockers.length === 0) return null

  return (
    <Card className="audit-score-insight__blockers app-card-metric hover:translate-y-0">
      <p className="audit-score-insight__eyebrow">Biggest blockers</p>
      <ul className="audit-score-insight__blocker-list">
        {blockers.map((item) => (
          <li key={item.label} className="audit-score-insight__blocker-item">
            <p className="audit-score-insight__blocker-title">{item.label}</p>
            {item.detail ? (
              <p className="audit-score-insight__blocker-detail">{item.detail}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  )
}

function ContributorsCard({ explanation }: { explanation: ReportScoreExplanation }) {
  const positives = explanation.positiveFactors.slice(0, 4)
  const categories = explanation.categorySummary
    .filter((item) => item.penalty > 0)
    .sort((a, b) => b.penalty - a.penalty)
    .slice(0, 4)

  return (
    <Card className="audit-score-insight__contributors app-card-metric hover:translate-y-0">
      <p className="audit-score-insight__eyebrow">Category impact</p>
      {categories.length > 0 ? (
        <ul className="audit-score-insight__category-list">
          {categories.map((item) => (
            <li key={item.category} className="audit-score-insight__category-row">
              <span className="audit-score-insight__category-label">
                {CATEGORY_LABELS[item.category] ?? item.category}
              </span>
              <span className="audit-score-insight__category-penalty">−{item.penalty} pts</span>
            </li>
          ))}
        </ul>
      ) : (
        <Text variant="muted" size="sm" className="mt-2 max-w-none">
          No major category penalties detected.
        </Text>
      )}

      {positives.length > 0 ? (
        <div className="audit-score-insight__strengths">
          <p className="audit-score-insight__eyebrow audit-score-insight__eyebrow--sub">
            Strengths
          </p>
          <ul className="audit-score-insight__strength-list">
            {positives.map((item) => (
              <li key={item.label} className="audit-score-insight__strength-item">
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  )
}

function RoiCard({
  audit,
  explanation,
}: {
  audit: AuditDetail
  explanation: ReportScoreExplanation
}) {
  const recovery = audit.runMetadata.recoverablePoints
  const ceiling = audit.runMetadata.scoreCeiling
  const growthPotential = audit.runMetadata.growthPotential

  const recoveryLine =
    typeof recovery === "number" && recovery > 0
      ? `Up to +${recovery} pts recoverable`
      : typeof growthPotential === "number" && growthPotential > audit.overallScore
        ? `Growth potential ${growthPotential}`
        : typeof ceiling === "number"
          ? `Score ceiling ${ceiling}`
          : null

  return (
    <Card className="audit-score-insight__roi app-card-metric hover:translate-y-0">
      <p className="audit-score-insight__eyebrow">Highest ROI path</p>
      <Text size="sm" className="audit-score-insight__roi-copy max-w-none leading-relaxed">
        {explanation.majorDeductions[0]?.label
          ? `Fix ${explanation.majorDeductions[0].label.toLowerCase()} first — it is the largest active deduction on this audit.`
          : "Resolve critical and high-severity findings first for the fastest score recovery."}
      </Text>
      {recoveryLine ? (
        <p className="audit-score-insight__roi-metric">{recoveryLine}</p>
      ) : null}
    </Card>
  )
}

export { AuditScoreExplanationSection }
