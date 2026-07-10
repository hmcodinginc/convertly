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
      eyebrow="Score insight"
      title="Why this score"
      description="What contributed most to your Growth Score and where the biggest recovery lives."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ScoreCard title="Score band" explanation={explanation} />
        <BlockersCard explanation={explanation} />
        <ContributorsCard explanation={explanation} />
        <RoiCard audit={audit} explanation={explanation} />
      </div>
    </AppPageSection>
  )
}

function ScoreCard({
  title,
  explanation,
}: {
  title: string
  explanation: ReportScoreExplanation
}) {
  return (
    <Card className="app-card-metric hover:translate-y-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/55">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
        {explanation.overallScore}
      </p>
      <Text variant="muted" size="sm" className="mt-1 max-w-none">
        {explanation.scoreBand}
      </Text>
      <Text variant="muted" size="sm" className="mt-3 max-w-none leading-relaxed">
        Intent profile: {explanation.websiteIntent.replace(/-/g, " ")}
      </Text>
    </Card>
  )
}

function BlockersCard({ explanation }: { explanation: ReportScoreExplanation }) {
  const blockers = explanation.majorDeductions.slice(0, 4)
  if (blockers.length === 0) return null

  return (
    <Card className="app-card-metric hover:translate-y-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/55">
        Biggest blockers
      </p>
      <ul className="mt-3 space-y-2">
        {blockers.map((item) => (
          <li key={item.label} className="rounded-lg border border-[color-mix(in_srgb,var(--border)_60%,transparent)] px-3 py-2">
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            {item.detail ? (
              <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.detail}</p>
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
    <Card className="app-card-metric hover:translate-y-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/55">
        Category impact
      </p>
      {categories.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {categories.map((item) => (
            <li
              key={item.category}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-foreground/85">
                {CATEGORY_LABELS[item.category] ?? item.category}
              </span>
              <span className="font-medium text-[#fca5a5]">−{item.penalty} pts</span>
            </li>
          ))}
        </ul>
      ) : (
        <Text variant="muted" size="sm" className="mt-3 max-w-none">
          No major category penalties detected.
        </Text>
      )}

      {positives.length > 0 ? (
        <>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-foreground/55">
            Strengths
          </p>
          <ul className="mt-2 space-y-1.5">
            {positives.map((item) => (
              <li key={item.label} className="text-sm text-[#86efac]">
                {item.label}
              </li>
            ))}
          </ul>
        </>
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

  return (
    <Card className="app-card-metric hover:translate-y-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/55">
        Highest ROI path
      </p>
      <Text size="sm" className="mt-3 max-w-none leading-relaxed">
        {explanation.majorDeductions[0]?.label
          ? `Fix ${explanation.majorDeductions[0].label.toLowerCase()} first — it is the largest active deduction on this audit.`
          : "Resolve critical and high-severity findings first for the fastest score recovery."}
      </Text>
      {typeof recovery === "number" ? (
        <p className="mt-3 text-sm font-medium text-[#86efac]">
          Up to +{recovery} pts recoverable
          {typeof ceiling === "number" ? ` · ceiling ${ceiling}` : ""}
        </p>
      ) : null}
    </Card>
  )
}

export { AuditScoreExplanationSection }
