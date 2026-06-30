import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { AuditReportSection } from "@/features/audits/components/AuditReportSection"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { getAuditStatusLabel, getAuditStatusVariant } from "@/lib/auditStatus"
import type { AuditDetail } from "@/types/audit"

type AuditMetadataSectionProps = {
  audit: AuditDetail
}

function AuditMetadataSection({ audit }: AuditMetadataSectionProps) {
  const meta = audit.runMetadata

  const rows: Array<{
    label: string
    value: string
    mono?: boolean
    isStatus?: boolean
    error?: boolean
  }> = [
    { label: "Audit engine", value: meta.auditEngineVersion },
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
    { label: "Status", value: getAuditStatusLabel(audit.status), isStatus: true },
  ]

  if (audit.status === "failed" && audit.errorMessage) {
    rows.push({ label: "Error", value: audit.errorMessage, error: true })
  }

  return (
    <AuditReportSection
      eyebrow="Details"
      title="Audit metadata"
      description="Run configuration, coverage, and engine details for this audit."
    >
      <Card className="audit-metadata-card app-card-table hover:translate-y-0">
        <dl>
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
                  <Text size="sm" className="max-w-none text-foreground/85">
                    {row.value}
                  </Text>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
    </AuditReportSection>
  )
}

export { AuditMetadataSection }
