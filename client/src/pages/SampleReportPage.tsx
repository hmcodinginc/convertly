import { ArrowLeft } from "lucide-react"
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

import { getAuditStatusVariant } from "@/lib/auditStatus"

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
          <div className="sample-report-intro">
            <Button
              variant="ghost"
              size="sm"
              className="sample-report-intro__back h-9 gap-1.5 px-0 text-foreground/70 hover:bg-transparent hover:text-foreground"
              asChild
            >
              <Link to={ROUTES.home}>
                <ArrowLeft className="size-4" aria-hidden />
                Back to marketing site
              </Link>
            </Button>
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
  const headerDate = audit.completedAtDate ?? audit.createdAt ?? audit.completedAt

  return (
    <div className="sample-report-body audit-report-page">
      <header className="audit-report-hero">
        <div className="audit-report-hero__content">
          <div className="audit-report-hero__eyebrow">
            <Text
              variant="muted"
              size="sm"
              className="max-w-none font-medium tracking-[0.18em] uppercase"
            >
              Audit report
            </Text>
            <StatusBadge label={audit.status} variant={getAuditStatusVariant(audit.status)} />
          </div>
          <h1 className="audit-report-hero__title">{audit.name}</h1>
          <p className="audit-report-hero__meta">
            <span>{audit.websiteUrl ?? audit.domain}</span>
            <span aria-hidden>·</span>
            <span>{headerDate}</span>
            <span aria-hidden>·</span>
            <span>{audit.pagesAnalyzed} pages analyzed</span>
          </p>
        </div>

        <div className="audit-report-hero__aside">
          <div
            className="audit-report-score-panel"
            aria-label={`Growth score ${audit.overallScore}`}
          >
            <p className="audit-report-score-panel__value">{audit.overallScore}</p>
            <p className="audit-report-score-panel__label">Growth score</p>
            <p className="audit-report-score-panel__hint">Weighted conversion health</p>
          </div>
        </div>
      </header>

      <div className="audit-report-layout">
        <div className="audit-report-layout__main">
          <AuditSummarySection audit={audit} />
          <ScoreBreakdownSection categories={audit.scoreBreakdown} auditStatus={audit.status} />
          <PageFindingsSection pages={audit.pageFindings} auditStatus={audit.status} />
          <SiteWideFindingsSection findings={audit.siteFindings} auditStatus={audit.status} />
          <PrioritizedIssuesSection
            issues={audit.issues}
            pages={audit.pageFindings}
            auditStatus={audit.status}
          />
          <AuditRecommendationsSection
            recommendations={audit.recommendations}
            pages={audit.pageFindings}
            domain={audit.domain}
          />
          <AuditMetadataSection audit={audit} />
        </div>

        <aside className="audit-report-layout__rail" aria-label="Audit timeline">
          <AuditTimelineSection events={audit.timeline} compact />
        </aside>
      </div>

      <div className="sample-report-cta">
        <Heading level={3} size="subsection" className="sample-report-cta__title">
          Ready to run this on your site?
        </Heading>
        <Text variant="muted" size="sm" className="sample-report-cta__description">
          Create a free account and launch your first Convertly audit in minutes.
        </Text>
        <div className="sample-report-cta__actions">
          <Button className="sample-report-cta__btn" asChild>
            <Link to={ROUTES.signup}>Create free account</Link>
          </Button>
          <Button variant="outline" className="sample-report-cta__btn" asChild>
            <Link to={ROUTES.home}>Return to marketing site</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SampleReportPage
