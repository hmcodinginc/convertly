import { Link } from "react-router-dom"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { PageError, PageLoading } from "@/components/feedback/PageState"
import { Navbar } from "@/components/layout/Navbar"
import { Section } from "@/components/layout/Section"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { AuditMetadataSection } from "@/features/audits/sections/AuditMetadataSection"
import { AuditRecommendationsSection } from "@/features/audits/sections/AuditRecommendationsSection"
import { AuditSummarySection } from "@/features/audits/sections/AuditSummarySection"
import { AuditTimelineSection } from "@/features/audits/sections/AuditTimelineSection"
import { PageFindingsSection } from "@/features/audits/sections/PageFindingsSection"
import { PrioritizedIssuesSection } from "@/features/audits/sections/PrioritizedIssuesSection"
import { SiteWideFindingsSection } from "@/features/audits/sections/SiteWideFindingsSection"
import { ScoreBreakdownSection } from "@/features/audits/sections/ScoreBreakdownSection"
import { useAsyncData } from "@/hooks/useAsyncData"
import { ROUTES } from "@/lib/routes"
import * as auditService from "@/services/auditService"
import type { AuditDetail } from "@/types/audit"

const auditStatusVariant = {
  Completed: "success",
  Running: "accent",
  Scheduled: "neutral",
} as const

function SampleReportPage() {
  const { data: audit, isLoading, isError, error, reload } = useAsyncData(
    () => auditService.getSampleAuditDetail(),
    []
  )

  return (
    <main className="app-atmosphere">
      <Navbar />

      <Section containerClassName="marketing-container">
        <div className="marketing-section-stack">
          <div className="space-y-4 border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] pb-8">
            <Text
              size="sm"
              className="max-w-none font-medium tracking-[0.16em] uppercase text-foreground/62"
            >
              Sample report
            </Text>
            <Heading level={1} size="title" className="max-w-3xl text-balance">
              See what a Convertly audit looks like
            </Heading>
            <Text variant="muted" size="lg" className="max-w-2xl leading-7">
              Explore a completed conversion audit with scores, prioritized issues, and AI
              recommendations your team can act on.
            </Text>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="marketing-cta-primary h-11" asChild>
                <Link to={ROUTES.signup}>Start Free Audit</Link>
              </Button>
              <Button variant="outline" className="marketing-cta-secondary h-11" asChild>
                <Link to={ROUTES.login}>Sign in</Link>
              </Button>
            </div>
          </div>

          {isLoading ? <PageLoading label="Loading sample report…" /> : null}
          {isError ? <PageError description={error ?? undefined} onRetry={reload} /> : null}
          {audit ? <SampleReportContent audit={audit} /> : null}
        </div>
      </Section>
    </main>
  )
}

function SampleReportContent({ audit }: { audit: AuditDetail }) {
  return (
    <div className="space-y-6">
      <header className="rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[color-mix(in_srgb,var(--surface)_58%,transparent)] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Text
                variant="muted"
                size="sm"
                className="max-w-none font-medium tracking-[0.16em] uppercase"
              >
                Audit report
              </Text>
              <StatusBadge label={audit.status} variant={auditStatusVariant[audit.status]} />
            </div>
            <Heading level={2} size="section" className="max-w-none">
              {audit.name}
            </Heading>
            <Text variant="muted" size="sm" className="max-w-none">
              {audit.domain} · {audit.completedAt} · {audit.pagesAnalyzed} pages analyzed
            </Text>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-4xl font-medium tabular-nums tracking-tight text-foreground">
              {audit.overallScore}
            </p>
            <Text variant="muted" size="sm" className="mt-1 max-w-none">
              Conversion score
            </Text>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_17rem] xl:items-start">
        <AuditSummarySection audit={audit} />
        <AuditTimelineSection events={audit.timeline} compact />
      </div>

      <ScoreBreakdownSection categories={audit.scoreBreakdown} auditStatus={audit.status} />
      <PageFindingsSection pages={audit.pageFindings} auditStatus={audit.status} />
      <SiteWideFindingsSection findings={audit.siteFindings} auditStatus={audit.status} />
      <PrioritizedIssuesSection issues={audit.issues} auditStatus={audit.status} />
      <AuditRecommendationsSection recommendations={audit.recommendations} />
      <AuditMetadataSection audit={audit} />

      <div className="rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[color-mix(in_srgb,var(--surface)_58%,transparent)] p-6 text-center sm:p-8">
        <Heading level={3} size="subsection" className="mx-auto max-w-xl text-balance">
          Ready to run this on your site?
        </Heading>
        <Text variant="muted" size="sm" className="mx-auto mt-3 max-w-lg leading-6">
          Create a free account and launch your first Convertly audit in minutes.
        </Text>
        <Button className="mt-5 h-11 px-6" asChild>
          <Link to={ROUTES.signup}>Create free account</Link>
        </Button>
      </div>
    </div>
  )
}

export default SampleReportPage
