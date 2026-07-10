import { useMemo } from "react"

import { AuditExecutionBotProtection } from "@/components/audit/execution/AuditExecutionBotProtection"
import { AuditExecutionScreen } from "@/components/audit/execution/AuditExecutionScreen"
import { useAuditExecution } from "@/hooks/useAuditExecution"
import { useVertlyPageContext } from "@/features/vertly/hooks/useVertly"
import type { AuditDetail } from "@/types/audit"

type AuditExecutionViewProps = {
  auditId: string
  onComplete?: (detail: AuditDetail) => void
  onFailed?: (errorMessage?: string) => void
  onBackToNewAudit?: () => void
  onRetry?: () => void
  className?: string
}

function AuditExecutionView({
  auditId,
  onComplete,
  onFailed,
  onBackToNewAudit,
  onRetry,
  className,
}: AuditExecutionViewProps) {
  const {
    state,
    displayPercentage,
    isLoading,
    showCompletion,
    completionDetail,
    failureOutcome,
  } = useAuditExecution({
    auditId,
    onCompleted: onComplete,
    onFailed,
  })

  const vertlyContext = useMemo(
    () =>
      state && failureOutcome !== "bot_protection"
        ? {
            surface: "audit-new" as const,
            title: state.domain,
            description: `Running audit on ${state.domain}`,
            metadata: {
              auditId: state.auditId,
              domain: state.domain,
              progress: displayPercentage,
              stage: state.currentStageId,
              status: state.status,
            },
          }
        : null,
    [state, displayPercentage, failureOutcome]
  )

  useVertlyPageContext(vertlyContext)

  if (failureOutcome === "bot_protection") {
    return (
      <div className={`audit-exec-screen audit-exec-screen--outcome ${className ?? ""}`}>
        <AuditExecutionBotProtection
          domain={state?.domain}
          onBack={onBackToNewAudit}
          onRetry={onRetry}
        />
      </div>
    )
  }

  return (
    <AuditExecutionScreen
      state={state}
      displayPercentage={displayPercentage}
      isLoading={isLoading}
      showCompletion={showCompletion}
      completionDetail={completionDetail}
      className={className}
    />
  )
}

export { AuditExecutionView }
