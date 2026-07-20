import { useMemo } from "react"

import { AuditReportActions } from "@/features/audits/components/AuditReportActions"
import { AuditReportHero } from "@/features/audits/components/AuditReportHero"
import { AuditReportNav, type AuditReportNavItem } from "@/features/audits/components/AuditReportNav"
import { AuditFindingsSection } from "@/features/audits/sections/AuditFindingsSection"
import { AuditMetadataSection } from "@/features/audits/sections/AuditMetadataSection"
import { AuditRecommendationsSection } from "@/features/audits/sections/AuditRecommendationsSection"
import { AuditScoreExplanationSection } from "@/features/audits/sections/AuditScoreExplanationSection"
import { AuditSummarySection } from "@/features/audits/sections/AuditSummarySection"
import { AuditTimelineSection } from "@/features/audits/sections/AuditTimelineSection"
import { AuditTopPrioritySection } from "@/features/audits/sections/AuditTopPrioritySection"
import { PageFindingsSection } from "@/features/audits/sections/PageFindingsSection"
import { ScoreBreakdownSection } from "@/features/audits/sections/ScoreBreakdownSection"
import { FEATURED_COUNT } from "@/features/audits/sections/AuditTopPrioritySection"
import type { AuditDetail } from "@/types/audit"

type AuditReportBodyProps = {
  audit: AuditDetail
  showActions?: boolean
}

function AuditReportBody({ audit, showActions = false }: AuditReportBodyProps) {
  const hasInsight = Boolean(audit.runMetadata.reportScoreExplanation)
  const hasAdditionalRecommendations = audit.recommendations.length > FEATURED_COUNT

  const navItems = useMemo(() => {
    const items: AuditReportNavItem[] = [
      { id: "overview", label: "Overview" },
    ]

    if (audit.recommendations.length > 0) {
      items.push({ id: "priorities", label: "Priorities" })
    }

    if (hasInsight) {
      items.push({ id: "insight", label: "Score insight" })
    }

    items.push(
      { id: "scores", label: "Scores" },
      { id: "pages", label: "Pages" },
      { id: "findings", label: "Findings" }
    )

    if (hasAdditionalRecommendations) {
      items.push({ id: "recommendations", label: "More fixes" })
    }

    items.push({ id: "details", label: "Details" })

    return items
  }, [audit.recommendations.length, hasAdditionalRecommendations, hasInsight])

  return (
    <>
      <AuditReportHero
        audit={audit}
        actions={showActions ? <AuditReportActions audit={audit} /> : undefined}
      />

      <AuditReportNav items={navItems} />

      <div className="audit-report-layout">
        <div className="audit-report-layout__main">
          <AuditSummarySection audit={audit} />
          <AuditTopPrioritySection
            recommendations={audit.recommendations}
            pages={audit.pageFindings}
            domain={audit.domain}
          />
          <AuditScoreExplanationSection audit={audit} />
          <ScoreBreakdownSection
            categories={audit.scoreBreakdown}
            auditStatus={audit.status}
          />
          <PageFindingsSection pages={audit.pageFindings} auditStatus={audit.status} />
          <AuditFindingsSection
            issues={audit.issues}
            siteFindings={audit.siteFindings}
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
    </>
  )
}

export { AuditReportBody }
