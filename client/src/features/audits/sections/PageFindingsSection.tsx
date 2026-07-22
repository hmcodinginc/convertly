import { ChevronDown, ChevronUp, FileSearch, ImageOff, Info } from "lucide-react"
import { useState } from "react"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { EmptyState } from "@/components/feedback/EmptyState"
import { AuditReportSection } from "@/features/audits/components/AuditReportSection"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { severityItems } from "@/features/audits/utils/severityPresentation"
import { isAuditInProgress } from "@/lib/auditStatus"
import type { AuditStatus, PageFinding } from "@/types/audit"

const DEFAULT_VISIBLE = 4

const PAGE_PREVIEW_HELP =
  "This preview comes from the page's Open Graph image (og:image). It is provided by the website and is not a live screenshot."

const pageStatusVariant = {
  Healthy: "success",
  "At risk": "warning",
  "Needs work": "danger",
} as const

type PageFindingsSectionProps = {
  pages: PageFinding[]
  auditStatus: AuditStatus
}

function getEmptyPagesMessage(status: AuditStatus): string {
  if (isAuditInProgress(status)) {
    return "Pages will appear here once discovery completes."
  }

  if (status === "failed") {
    return "No pages were discovered before this audit failed."
  }

  return "No pages were discovered for this audit."
}

function SeverityChips({
  breakdown,
}: {
  breakdown: NonNullable<PageFinding["severityBreakdown"]>
}) {
  const items = severityItems({
    Critical: breakdown.critical,
    High: breakdown.high,
    Medium: breakdown.medium,
    Low: breakdown.low,
  })

  if (items.length === 0) return null

  return (
    <div className="audit-page-card__severity">
      {items.map((item) => (
        <span key={item.severity} className="audit-page-card__severity-chip">
          {item.severity} {item.count}
        </span>
      ))}
    </div>
  )
}

function PageScoreRing({ score }: { score: number }) {
  const radius = 15.5
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  return (
    <div
      className="audit-page-card__score-ring"
      role="img"
      aria-label={`Page score ${score}`}
    >
      <svg viewBox="0 0 36 36" className="audit-page-card__score-svg" aria-hidden>
        <circle
          className="audit-page-card__score-track"
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          strokeWidth="3"
        />
        <circle
          className="audit-page-card__score-progress"
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          strokeWidth="3"
          strokeDasharray={`${progress} ${circumference}`}
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span className="audit-page-card__score-value tabular-nums">{score}</span>
    </div>
  )
}

function PageFavicon({
  faviconUrl,
  label,
}: {
  faviconUrl?: string | null
  label: string
}) {
  const [failed, setFailed] = useState(false)

  if (!faviconUrl || failed) return null

  return (
    <img
      src={faviconUrl}
      alt=""
      width={16}
      height={16}
      loading="lazy"
      decoding="async"
      className="audit-page-card__favicon"
      onError={() => setFailed(true)}
      aria-hidden
      title={`${label} favicon`}
    />
  )
}

function PagePreview({ imageUrl }: { imageUrl?: string | null }) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(imageUrl) && !failed

  return (
    <div className="audit-page-preview">
      <div className="audit-page-preview__label-row">
        <p className="audit-page-preview__label">Page Preview</p>
        <button
          type="button"
          className="audit-page-preview__info"
          title={PAGE_PREVIEW_HELP}
          aria-label={PAGE_PREVIEW_HELP}
          data-tooltip={PAGE_PREVIEW_HELP}
        >
          <Info className="size-3" aria-hidden />
        </button>
      </div>

      <div className="audit-page-preview__frame">
        {showImage ? (
          <img
            src={imageUrl!}
            alt=""
            loading="lazy"
            decoding="async"
            className="audit-page-preview__image"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="audit-page-preview__empty">
            <ImageOff className="audit-page-preview__empty-glyph" aria-hidden />
            <span className="audit-page-preview__empty-title">No preview</span>
          </div>
        )}
      </div>
    </div>
  )
}

function PageCard({ page }: { page: PageFinding }) {
  return (
    <Card className="audit-page-card audit-page-card--v2 app-card-metric hover:translate-y-0">
      <div className="audit-page-card__body">
        <div className="audit-page-card__primary">
          <div className="audit-page-card__heading">
            <div className="audit-page-card__title-row">
              <PageFavicon faviconUrl={page.faviconUrl} label={page.label} />
              <h3 className="audit-page-card__title" title={page.label}>
                {page.label}
              </h3>
            </div>
            <StatusBadge
              label={page.status}
              variant={pageStatusVariant[page.status]}
            />
          </div>

          <p className="audit-page-card__path" title={page.url ?? page.path}>
            {page.url ?? page.path}
          </p>

          <div className="audit-page-card__meta-row">
            {page.pageType ? (
              <span className="audit-page-card__meta-chip">{page.pageType}</span>
            ) : null}
            {page.discoveryStatus ? (
              <span className="audit-page-card__meta-chip">{page.discoveryStatus}</span>
            ) : null}
          </div>
        </div>

        <div className="audit-page-card__metrics">
          <PageScoreRing score={page.score} />
          <div className="audit-page-card__metrics-body">
            <div className="audit-page-card__stat">
              <p className="audit-page-card__stat-value tabular-nums">
                {page.issuesCount}
              </p>
              <Text variant="muted" size="sm" className="mt-0 max-w-none text-xs">
                Issue{page.issuesCount === 1 ? "" : "s"}
              </Text>
            </div>
            {page.severityBreakdown ? (
              <SeverityChips breakdown={page.severityBreakdown} />
            ) : null}
            {page.categoryBreakdown && page.categoryBreakdown.length > 0 ? (
              <p className="audit-page-card__categories">
                {page.categoryBreakdown
                  .map((item) => `${item.category} ${item.count}`)
                  .join(" · ")}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="audit-page-card__footer">
        <PagePreview imageUrl={page.openGraphImage} />
      </div>
    </Card>
  )
}

function PageFindingsSection({ pages, auditStatus }: PageFindingsSectionProps) {
  const [showAll, setShowAll] = useState(false)
  const hasMore = pages.length > DEFAULT_VISIBLE
  const visible = showAll ? pages : pages.slice(0, DEFAULT_VISIBLE)
  const hiddenCount = pages.length - DEFAULT_VISIBLE

  return (
    <AuditReportSection
      id="pages"
      eyebrow="Coverage"
      title="Page analysis"
      description="Per-page conversion scores, reachability, and finding density across your core funnel."
    >
      {pages.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="No pages discovered"
          description={getEmptyPagesMessage(auditStatus)}
        />
      ) : (
        <div className="audit-page-section">
          <div className="audit-page-grid">
            {visible.map((page) => (
              <PageCard key={page.id} page={page} />
            ))}
          </div>
          {hasMore ? (
            <button
              type="button"
              className="audit-page-section__toggle"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="size-4" aria-hidden />
                  Show fewer pages
                </>
              ) : (
                <>
                  <ChevronDown className="size-4" aria-hidden />
                  View all {pages.length} pages
                  <span className="audit-page-section__toggle-hint">
                    +{hiddenCount} more
                  </span>
                </>
              )}
            </button>
          ) : null}
        </div>
      )}
    </AuditReportSection>
  )
}

export { PageFindingsSection }
