import { useState } from "react"

import { parseImpactForPresentation, getEvidenceContextLine } from "@/features/audits/utils/evidencePresentation"

const PAGES_VISIBLE = 3

type FindingImpactBodyProps = {
  impact: string
  title: string
  page?: string
  scope?: "page" | "site"
  recommendation?: string
  affectedPages?: string[]
  pageLabels?: string[]
}

function FindingImpactBody({
  impact,
  title,
  page,
  scope = "page",
  recommendation,
  affectedPages,
  pageLabels,
}: FindingImpactBodyProps) {
  const [pagesExpanded, setPagesExpanded] = useState(false)
  const parsed = parseImpactForPresentation(impact)
  const contextLine = getEvidenceContextLine(title, parsed.evidence)
  const pages = affectedPages ?? (page ?? parsed.pageFromImpact ? [page ?? parsed.pageFromImpact!] : [])
  const labels = pageLabels ?? pages
  const hasMorePages = pages.length > PAGES_VISIBLE

  return (
    <div className="audit-finding-item__body">
      {contextLine ? <p className="audit-finding-item__context">{contextLine}</p> : null}

      {recommendation ? (
        <div className="audit-finding-item__field">
          <span className="audit-finding-item__field-label">Recommendation</span>
          <p className="audit-finding-item__text">{recommendation}</p>
        </div>
      ) : null}

      {scope === "site" ? (
        <div className="audit-finding-item__field">
          <span className="audit-finding-item__field-label">Scope</span>
          <span className="audit-finding-item__scope">Entire site</span>
        </div>
      ) : pages.length > 0 ? (
        <div className="audit-finding-item__field">
          <span className="audit-finding-item__field-label">
            {pages.length === 1 ? "Affected page" : `Affected pages (${pages.length})`}
          </span>
          {pages.length === 1 ? (
            <code className="audit-finding-item__path">{pages[0]}</code>
          ) : (
            <div className="audit-finding-item__page-list-wrap">
              <ul
                className="audit-finding-item__page-list"
                data-scrollable={pagesExpanded && hasMorePages ? "true" : undefined}
              >
                {(pagesExpanded ? labels : labels.slice(0, PAGES_VISIBLE)).map((label, index) => (
                  <li key={`${label}-${pages[index] ?? index}`}>
                    <span className="audit-finding-item__page-label">{label}</span>
                    {pages[index] ? (
                      <code className="audit-finding-item__path">{pages[index]}</code>
                    ) : null}
                  </li>
                ))}
              </ul>
              {hasMorePages ? (
                <button
                  type="button"
                  className="audit-finding-item__pages-toggle"
                  onClick={() => setPagesExpanded((prev) => !prev)}
                >
                  {pagesExpanded
                    ? "Show fewer"
                    : `+${pages.length - PAGES_VISIBLE} more pages`}
                </button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {parsed.evidence.length > 0 ? (
        <div className="audit-finding-item__field">
          <span className="audit-finding-item__field-label">Evidence</span>
          <dl className="audit-finding-item__evidence">
            {parsed.evidence.map((row) => (
              <div key={`${row.label}-${row.value}`} className="audit-finding-item__evidence-row">
                <dt className="audit-finding-item__evidence-label">{row.displayLabel}</dt>
                <dd className="audit-finding-item__evidence-value">{row.displayValue}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <div className="audit-finding-item__field">
          <span className="audit-finding-item__field-label">Details</span>
          <p className="audit-finding-item__text">{impact}</p>
        </div>
      )}
    </div>
  )
}

export { FindingImpactBody }
