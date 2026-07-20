import { useMemo } from "react"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

import { PageError } from "@/components/feedback/PageState"
import { Navbar } from "@/components/layout/Navbar"
import { Section } from "@/components/layout/Section"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { AuditReportBody } from "@/features/audits/components/AuditReportBody"
import { AuditReportSkeletonContent } from "@/features/audits/components/AuditReportSkeletonContent"
import { useVertlyPageContext } from "@/features/vertly/hooks/useVertly"
import { buildVertlyAuditSnapshotFromDetail } from "@/features/vertly/routing/buildVertlyAuditSnapshot"
import { useAsyncData } from "@/hooks/useAsyncData"
import { ROUTES } from "@/lib/routes"
import * as auditService from "@/services/auditService"
import type { AuditDetail } from "@/types/audit"

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

          {isLoading ? <AuditReportSkeletonContent /> : null}
          {isError ? <PageError description={error ?? undefined} onRetry={reload} /> : null}
          {audit ? <SampleReportContent audit={audit} /> : null}
        </div>
      </Section>
    </main>
  )
}

function SampleReportContent({ audit }: { audit: AuditDetail }) {
  const vertlyContext = useMemo(
    () => ({
      surface: "sample-report" as const,
      title: audit.domain,
      description: `Sample audit report for ${audit.domain}`,
      auditContext: buildVertlyAuditSnapshotFromDetail(audit),
      metadata: {
        auditId: audit.id,
        domain: audit.domain,
        score: audit.overallScore,
        status: audit.status,
        sample: true,
      },
    }),
    [audit]
  )

  useVertlyPageContext(vertlyContext)

  return (
    <div className="sample-report-body audit-report-page">
      <AuditReportBody audit={audit} />

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
