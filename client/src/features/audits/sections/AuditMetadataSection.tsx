import { ChevronDown } from "lucide-react"
import { useState } from "react"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { AuditReportSection } from "@/features/audits/components/AuditReportSection"
import { getConfidenceDisplayLabel } from "@/features/audits/utils/confidencePresentation"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { getAuditStatusLabel, getAuditStatusVariant } from "@/lib/auditStatus"
import type { AuditDetail } from "@/types/audit"
import { cn } from "@/lib/utils"

type AuditMetadataSectionProps = {
  audit: AuditDetail
}

function AuditMetadataSection({ audit }: AuditMetadataSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const meta = audit.runMetadata

  const engineDisplayName = "Convertly V1"

  const rows: Array<{
    label: string
    value: string
    mono?: boolean
    isStatus?: boolean
    error?: boolean
  }> = [
    { label: "Audit engine", value: engineDisplayName },
    { label: "Rules evaluated", value: String(meta.ruleCount) },
    { label: "Pages discovered", value: String(meta.pagesDiscovered) },
    { label: "Pages reachable", value: String(meta.pagesReachable) },
    { label: "Pages unreachable", value: String(meta.pagesUnreachable) },
    { label: "Pages analyzed", value: String(meta.pagesAnalyzed) },
    { label: "Page findings", value: String(meta.pageFindingsCount) },
    { label: "Site findings", value: String(meta.siteFindingsCount) },
    { label: "Total findings", value: String(meta.findingsCount) },
    { label: "Website URL", value: audit.websiteUrl ?? audit.domain, mono: true },
    { label: "Domain", value: audit.domain, mono: true },
    { label: "Created", value: audit.createdAt ?? audit.completedAt },
    {
      label: "Completed",
      value:
        audit.completedAtDate ??
        (audit.status === "completed" || audit.status === "Completed"
          ? audit.completedAt
          : "—"),
    },
    ...(audit.duration ? [{ label: "Duration", value: audit.duration }] : []),
    { label: "Status", value: getAuditStatusLabel(audit.status), isStatus: true },
  ]

  if (meta.auditConfidence != null) {
    const confidenceLabel = getConfidenceDisplayLabel(meta)
    rows.push({
      label: "Audit confidence",
      value: `${meta.auditConfidence}%${confidenceLabel ? ` · ${confidenceLabel}` : ""}`,
    })
  }

  if (meta.growthPotential != null) {
    rows.push({
      label: "Growth potential",
      value:
        meta.recoverablePoints != null && meta.recoverablePoints > 0
          ? `${meta.growthPotential} (+${meta.recoverablePoints} recoverable)`
          : String(meta.growthPotential),
    })
  }

  if (meta.scoreCeiling != null && meta.scoreCeiling < 94) {
    rows.push({ label: "Score ceiling", value: String(meta.scoreCeiling) })
  }

  if (audit.status === "failed" && audit.errorMessage) {
    rows.push({ label: "Error", value: audit.errorMessage, error: true })
  }

  return (
    <AuditReportSection
      id="details"
      eyebrow="Details"
      title="Technical details"
      description="Run configuration, coverage metrics, and engine metadata."
      className="audit-metadata-section"
    >
      <Card className="audit-metadata-card app-card-table hover:translate-y-0">
        <button
          type="button"
          className="audit-metadata-toggle"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          <span className="audit-metadata-toggle__label">
            {expanded ? "Hide run details" : "Show run details"}
          </span>
          <span className="audit-metadata-toggle__meta">
            {meta.pagesAnalyzed} pages · {meta.findingsCount} findings · {engineDisplayName}
          </span>
          <ChevronDown
            className={cn(
              "audit-metadata-toggle__icon size-4",
              expanded && "audit-metadata-toggle__icon--open"
            )}
            aria-hidden
          />
        </button>

        {expanded ? (
          <dl className="audit-metadata-card__body">
            {rows.map((row, index) => (
              <div
                key={row.label}
                className={
                  index < rows.length - 1
                    ? "audit-metadata-row flex flex-col gap-1 border-b border-[color-mix(in_srgb,var(--border)_55%,transparent)] px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                    : "audit-metadata-row flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                }
              >
                <dt>
                  <Text size="sm" className="max-w-none font-medium text-foreground/80">
                    {row.label}
                  </Text>
                </dt>
                <dd className="sm:text-right">
                  {row.isStatus ? (
                    <StatusBadge
                      label={row.value}
                      variant={getAuditStatusVariant(audit.status)}
                    />
                  ) : row.mono ? (
                    <span className="audit-metadata-value font-mono text-sm text-foreground/90">
                      {row.value}
                    </span>
                  ) : row.error ? (
                    <Text size="sm" className="max-w-none text-[#fca5a5]">
                      {row.value}
                    </Text>
                  ) : (
                    <Text size="sm" className="max-w-none tabular-nums text-foreground/85">
                      {row.value}
                    </Text>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Card>
    </AuditReportSection>
  )
}

export { AuditMetadataSection }
