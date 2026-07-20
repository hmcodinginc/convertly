import { useState } from "react"

import { AuditReportSection } from "@/features/audits/components/AuditReportSection"
import { PrioritizedIssuesSection } from "@/features/audits/sections/PrioritizedIssuesSection"
import { SiteWideFindingsSection } from "@/features/audits/sections/SiteWideFindingsSection"
import type { AuditStatus, Issue, PageFinding, SiteFinding } from "@/types/audit"
import { cn } from "@/lib/utils"

type AuditFindingsSectionProps = {
  issues: Issue[]
  siteFindings: SiteFinding[]
  pages: PageFinding[]
  auditStatus: AuditStatus
}

type FindingsTab = "page" | "site"

function AuditFindingsSection({
  issues,
  siteFindings,
  pages,
  auditStatus,
}: AuditFindingsSectionProps) {
  const defaultTab: FindingsTab = issues.length > 0 || siteFindings.length === 0 ? "page" : "site"
  const [activeTab, setActiveTab] = useState<FindingsTab>(defaultTab)

  const pageCount = issues.length
  const siteCount = siteFindings.length

  return (
    <AuditReportSection
      id="findings"
      eyebrow="Findings"
      title="Issues to address"
      description="Conversion issues grouped by scope. Page-specific findings are listed separately from site-wide checks."
    >
      <div className="audit-findings-panel">
        <div className="audit-findings-panel__tabs" role="tablist" aria-label="Finding scope">
          <button
            type="button"
            role="tab"
            id="findings-tab-page"
            aria-selected={activeTab === "page"}
            aria-controls="findings-panel-page"
            className={cn(
              "audit-findings-panel__tab",
              activeTab === "page" && "audit-findings-panel__tab--active"
            )}
            onClick={() => setActiveTab("page")}
          >
            Page issues
            {pageCount > 0 ? (
              <span className="audit-findings-panel__tab-count">{pageCount}</span>
            ) : null}
          </button>
          <button
            type="button"
            role="tab"
            id="findings-tab-site"
            aria-selected={activeTab === "site"}
            aria-controls="findings-panel-site"
            className={cn(
              "audit-findings-panel__tab",
              activeTab === "site" && "audit-findings-panel__tab--active"
            )}
            onClick={() => setActiveTab("site")}
          >
            Site-wide
            {siteCount > 0 ? (
              <span className="audit-findings-panel__tab-count">{siteCount}</span>
            ) : null}
          </button>
        </div>

        <div
          id="findings-panel-page"
          role="tabpanel"
          aria-labelledby="findings-tab-page"
          hidden={activeTab !== "page"}
          className="audit-findings-panel__content"
        >
          <PrioritizedIssuesSection
            issues={issues}
            pages={pages}
            auditStatus={auditStatus}
            embedded
          />
        </div>

        <div
          id="findings-panel-site"
          role="tabpanel"
          aria-labelledby="findings-tab-site"
          hidden={activeTab !== "site"}
          className="audit-findings-panel__content"
        >
          <SiteWideFindingsSection
            findings={siteFindings}
            auditStatus={auditStatus}
            embedded
          />
        </div>
      </div>
    </AuditReportSection>
  )
}

export { AuditFindingsSection }
