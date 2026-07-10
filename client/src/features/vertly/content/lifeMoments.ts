import type { VertlyMilestoneId, VertlyPageContext } from "@/features/vertly/types"

export type VertlyLifeMoment = {
  id: string
  message: string
  autoDismissMs?: number
  opensPanel?: boolean
}

export const VERTLY_MILESTONE_MESSAGES: Record<
  VertlyMilestoneId,
  { message: string; opensPanel?: boolean }
> = {
  "first-login": {
    message: "Welcome! I'm Vertly — glad you're here.",
    opensPanel: false,
  },
  "first-audit": {
    message: "Your first audit is ready — nice work!",
    opensPanel: true,
  },
  "first-upgrade": {
    message: "Welcome to Premium. Let's unlock more audits.",
    opensPanel: true,
  },
  "first-billing": {
    message: "Your plan controls how many audits you can run each month.",
    opensPanel: true,
  },
}

export function resolvePageLifeMoment(context: VertlyPageContext): VertlyLifeMoment | null {
  const meta = context.metadata ?? {}

  switch (context.surface) {
    case "signup":
      return {
        id: "life-signup-setup",
        message: "I'll guide you through setup.",
        autoDismissMs: 5400,
      }

    case "dashboard":
      return {
        id: "life-dashboard-watch",
        message: "I'm watching your latest audits.",
        autoDismissMs: 5200,
      }

    case "billing":
    case "billing-return":
      return {
        id: "life-billing-plans",
        message: "I can explain every plan.",
        autoDismissMs: 5200,
      }

    case "audit-detail":
      return {
        id: `life-audit-findings-${meta.auditId ?? "generic"}`,
        message: "This report has a few interesting findings.",
        autoDismissMs: 5500,
        opensPanel: true,
      }

    case "workspace":
      return {
        id: "life-workspace-organize",
        message: "Need help organizing domains?",
        autoDismissMs: 5200,
      }

    default:
      return null
  }
}

export function isAuditCompleted(status: unknown): boolean {
  if (typeof status !== "string") return false
  const normalized = status.toLowerCase()
  return normalized === "completed" || normalized === "complete"
}
