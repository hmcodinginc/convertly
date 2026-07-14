import { ROUTES } from "@/lib/routes"
import type { VertlyConversationRequest, VertlyConversationResponse } from "@/features/vertly/types"

function formatPeriodEnd(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function handleUserStateRoute(
  request: VertlyConversationRequest
): VertlyConversationResponse {
  const enriched = request.enrichedContext
  const normalized = request.message.trim().toLowerCase()

  if (!enriched) {
    return {
      content:
        "Sign in to see your live plan, usage, and workspace details. I can still explain Convertly features in general — ask about audits, billing, or reports.",
      suggestions: [
        { id: "us-login", label: "Sign in", href: ROUTES.login },
        { id: "us-plans", label: "View plans", href: ROUTES.billing },
      ],
    }
  }

  const lines: string[] = []

  if (
    normalized.includes("name") ||
    normalized.includes("who am i") ||
    normalized.includes("profile") ||
    (normalized.includes("account") && !normalized.includes("audit"))
  ) {
    if (enriched.account) {
      lines.push(
        `You're signed in as **${enriched.account.fullName}** (${enriched.account.firstName} ${enriched.account.lastName}).`,
        `Email: ${enriched.account.email}`
      )
    }
  }

  if (
    normalized.includes("plan") ||
    normalized.includes("subscription") ||
    (normalized.includes("billing") && !normalized.includes("how")) ||
    normalized.includes("am i on")
  ) {
    if (lines.length === 0) {
      lines.push(`You're on the **${enriched.plan.planName}** plan (${enriched.plan.status.replace("_", " ")}).`)
    } else {
      lines.push(`**Current plan:** ${enriched.plan.planName} (${enriched.plan.status.replace("_", " ")})`)
    }

    if (enriched.plan.renewalDate) {
      lines.push(`Renewal: ${enriched.plan.renewalDate}`)
    } else if (enriched.usage.period === "lifetime") {
      lines.push("Lifetime allowance — no monthly reset")
    }

    if (enriched.pendingPlan) {
      lines.push(
        `**Pending plan change:** ${enriched.pendingPlan.planName}${
          enriched.showPendingPlanCheckout ? " — checkout resume available on Billing" : ""
        }`
      )
    }

    if (enriched.scheduledPlanChange) {
      lines.push(
        `**Scheduled change:** ${enriched.scheduledPlanChange.planName} on ${enriched.scheduledPlanChange.changeAtFormatted ?? "next cycle"}`
      )
    }

    if (enriched.plan.cancelAtPeriodEnd) {
      lines.push("Your subscription is set to cancel at period end.")
    }
  }

  if (
    normalized.includes("audit") &&
    (normalized.includes("left") ||
      normalized.includes("remaining") ||
      normalized.includes("usage") ||
      normalized.includes("allowance") ||
      normalized.includes("limit") ||
      normalized.includes("how many"))
  ) {
    lines.push(
      `You have **${enriched.usage.auditsRemaining} of ${enriched.usage.auditsIncluded}** ${
        enriched.usage.period === "month" ? "monthly" : "lifetime"
      } audits remaining.`,
      `Used: **${enriched.usage.auditsUsed}** · Plan: **${enriched.plan.planName}**`,
      enriched.entitlement.blockedByLimit
        ? "You've reached your limit — renewal or upgrade required to run more."
        : "Only completed audits consume allowance."
    )

    if (enriched.entitlement.periodEndFormatted) {
      lines.push(`Your allowance resets on **${enriched.entitlement.periodEndFormatted}**.`)
    } else if (enriched.usage.periodEnd) {
      lines.push(`Your allowance resets on **${formatPeriodEnd(enriched.usage.periodEnd)}**.`)
    }
  }

  if (normalized.includes("workspace") || normalized.includes("domain")) {
    lines.push(
      `**Workspace:** ${enriched.workspace.name}`,
      `Domains monitored: ${enriched.workspace.domainCount}${
        enriched.workspace.primaryDomain
          ? ` (primary: ${enriched.workspace.primaryDomain})`
          : ""
      }`
    )
  }

  if (lines.length === 0) {
    return {
      content:
        "I can answer personal account questions — your plan, audits remaining, workspace, or profile.\n\n" +
        "Try: \"What plan am I on?\" or \"How many audits do I have left?\"",
      suggestions: [
        {
          id: "us-plan",
          label: "My plan",
          prompt: "What plan am I on?",
        },
        {
          id: "us-remaining",
          label: "Audits left",
          prompt: "How many audits do I have left?",
        },
      ],
    }
  }

  return {
    content: lines.join("\n\n"),
    suggestions: [
      {
        id: "us-workspace",
        label: "Open workspace",
        href: ROUTES.workspace,
      },
      {
        id: "us-billing",
        label: "View billing",
        href: ROUTES.billing,
      },
      {
        id: "us-new-audit",
        label: "Run audit",
        prompt: "How do I start a new audit?",
        href: ROUTES.auditNew,
      },
    ],
  }
}
