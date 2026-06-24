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
  const rows = [
    { label: "Website URL", value: audit.websiteUrl ?? audit.domain, mono: true },
    { label: "Domain", value: audit.domain, mono: true },
    { label: "Created", value: audit.createdAt ?? audit.completedAt },
    {
      label: "Completed",
      value: audit.completedAtDate ?? (audit.status === "completed" || audit.status === "Completed" ? audit.completedAt : "—"),
    },
    { label: "Pages analyzed", value: String(audit.pagesAnalyzed) },
    { label: "Status", value: getAuditStatusLabel(audit.status), isStatus: true },
  ]

  if (audit.status === "failed" && audit.errorMessage) {
    rows.push({ label: "Error", value: audit.errorMessage })
  }

  return (
    <AuditReportSection
      eyebrow="Details"
      title="Audit metadata"
      description="Run configuration and scope for this audit."
    >
      <Card className="app-card-table hover:translate-y-0">
        <dl>
          {rows.map((row, index) => (
            <div
              key={row.label}
              className={
                index < rows.length - 1
                  ? "flex flex-col gap-1 border-b border-[color-mix(in_srgb,var(--border)_55%,transparent)] px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                  : "flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
              }
            >
              <dt>
                <Text size="sm" className="max-w-none font-medium text-foreground/80">
                  {row.label}
                </Text>
              </dt>
              <dd className="sm:text-right">
                {"isStatus" in row && row.isStatus ? (
                  <StatusBadge
                    label={row.value}
                    variant={getAuditStatusVariant(audit.status)}
                  />
                ) : "mono" in row && row.mono ? (
                  <span className="font-mono text-sm text-foreground/90">{row.value}</span>
                ) : row.label === "Error" ? (
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
