import { ROUTES } from "@/lib/routes"
import type { VertlyConversationRequest, VertlyConversationResponse, VertlyRoutingResult } from "@/features/vertly/types"

function formatBlock(answer: string, details?: string, context?: string): string {
  const parts = [answer]
  if (details) parts.push(details)
  if (context) parts.push(context)
  return parts.join("\n\n")
}

export function handleWorkspaceRoute(
  request: VertlyConversationRequest,
  routing: VertlyRoutingResult
): VertlyConversationResponse {
  const subtopic = routing.subtopic ?? "overview"
  const enriched = request.enrichedContext

  let content: string

  switch (subtopic) {
    case "counted-audits":
      content = formatBlock(
        "Only **completed** audits consume allowance.",
        "**Counted: Yes** — finished successfully. **Counted: No** — draft, failed, in-progress, or deleted before completion.",
        "Use the ledger's **Counted** column to reconcile usage."
      )
      break
    case "ledger":
      content = formatBlock(
        "The **audit ledger** lists every session — completed, failed, draft, running, and removed.",
        "Each row shows URL, audit type, status, created date, and whether it counted against your plan.",
        enriched
          ? `You've used **${enriched.usage.auditsUsed}** of **${enriched.usage.auditsIncluded}** completed audits this period.`
          : undefined
      )
      break
    case "remaining-audits":
      content = formatBlock(
        "**Remaining audits** = included allowance minus completed audits this period.",
        "Drafts and in-progress runs do not reduce remaining until they complete.",
        enriched
          ? `You have **${enriched.usage.auditsRemaining} of ${enriched.usage.auditsIncluded}** remaining on **${enriched.plan.planName}**.`
          : undefined
      )
      break
    case "reset-date":
      content = formatBlock(
        "Your allowance resets at the start of each billing period (or never, on lifetime plans).",
        "Only completed audits count toward the limit.",
        enriched?.entitlement.periodEndFormatted
          ? `Your allowance resets on **${enriched.entitlement.periodEndFormatted}**.`
          : enriched?.usage.period === "lifetime"
            ? "Your plan uses a **lifetime** allowance — no monthly reset."
            : undefined
      )
      break
    case "overview":
    default:
      content = formatBlock(
        "Workspace shows plan usage, the audit ledger, and monitored domains.",
        "Use it to reconcile allowance usage and track every audit session."
      )
      break
  }

  return {
    content,
    suggestions: [
      { id: "ws-counted", label: "Why counted?", prompt: "Why was this audit counted?" },
      { id: "ws-ledger", label: "Audit ledger", href: ROUTES.workspace },
      { id: "ws-reset", label: "Allowance reset", prompt: "When does my allowance reset?" },
      { id: "ws-remaining", label: "Audits left", prompt: "How many audits do I have left?" },
    ],
  }
}
