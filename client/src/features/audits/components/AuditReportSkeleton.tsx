import { AppPageShell } from "@/components/layout/AppPageShell"
import { AuditReportSkeletonContent } from "@/features/audits/components/AuditReportSkeletonContent"

function AuditReportSkeleton() {
  return (
    <AppPageShell sectionsClassName="audit-report-sections" header={null}>
      <AuditReportSkeletonContent />
    </AppPageShell>
  )
}

export { AuditReportSkeleton }
