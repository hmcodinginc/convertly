import { ROUTES } from "@/lib/routes"
import {
  getEffectivePlanEntitlement,
  type EffectivePlanId,
} from "@/lib/billingPlans"
import type { VertlyConversationRequest, VertlyConversationResponse, VertlyRoutingResult } from "@/features/vertly/types"

function formatBlock(answer: string, details?: string, context?: string): string {
  const parts = [answer]
  if (details) parts.push(details)
  if (context) parts.push(context)
  return parts.join("\n\n")
}

function planAllowanceLabel(planId: EffectivePlanId): string {
  const plan = getEffectivePlanEntitlement(planId)
  return plan.period === "lifetime"
    ? `${plan.auditsPerPeriod} lifetime`
    : `${plan.auditsPerPeriod}/month`
}

export function handleBillingRoute(
  request: VertlyConversationRequest,
  routing: VertlyRoutingResult
): VertlyConversationResponse {
  const subtopic = routing.subtopic ?? "overview"
  const enriched = request.enrichedContext

  let content: string

  switch (subtopic) {
    case "limits":
      if (enriched?.entitlement.blockedByLimit) {
        content = formatBlock(
          "You've reached your audit allowance for this period.",
          "Only completed audits count — drafts and failed runs do not.",
          enriched.entitlement.periodEndFormatted
            ? `Allowance resets on **${enriched.entitlement.periodEndFormatted}**. Upgrade to run more now.`
            : "Upgrade on Billing to increase your allowance."
        )
      } else if (enriched) {
        content = formatBlock(
          `You still have **${enriched.usage.auditsRemaining} of ${enriched.usage.auditsIncluded}** audits remaining.`,
          "If starting is blocked, check for a stuck in-progress run or an unresolved draft.",
          `Current plan: **${enriched.plan.planName}**.`
        )
      } else {
        content = formatBlock(
          "Audit limits depend on your plan — only completed audits consume allowance.",
          "Sign in to see your remaining audits and reset date."
        )
      }
      break
    case "plans":
      content = formatBlock(
        `Plans: **Free** (${planAllowanceLabel("free")}), **Starter** (${planAllowanceLabel("starter")}), **Growth** (${planAllowanceLabel("growth")}), **Scale** (${planAllowanceLabel("scale")}).`,
        "Higher tiers include more monthly audits and workspace features.",
        enriched ? `You're on **${enriched.plan.planName}**.` : undefined
      )
      break
    case "upgrades":
      content = formatBlock(
        "Upgrade from **Billing** to increase your audit allowance or unlock higher tiers.",
        "Plan changes may take effect immediately or at renewal depending on subscription state.",
        enriched?.scheduledPlanChange
          ? `Scheduled change: **${enriched.scheduledPlanChange.planName}** on ${enriched.scheduledPlanChange.changeAtFormatted ?? "next cycle"}.`
          : undefined
      )
      break
    case "renewals":
      content = formatBlock(
        "Paid plans renew monthly through Razorpay.",
        "Cancel-at-period-end keeps access until the current cycle ends.",
        enriched?.plan.renewalDate
          ? `Your renewal date: **${enriched.plan.renewalDate}**.`
          : enriched?.usage.period === "lifetime"
            ? "Lifetime plans do not renew."
            : undefined
      )
      break
    case "overview":
    default:
      content = formatBlock(
        "Billing manages your subscription, plan tier, and payment method.",
        "Audit allowance is tied to your plan — view usage on Workspace."
      )
      break
  }

  return {
    content,
    suggestions: [
      { id: "bl-plans", label: "Compare plans", prompt: "What plans does Convertly offer?" },
      { id: "bl-usage", label: "My allowance", prompt: "How many audits do I have left?" },
      { id: "bl-mine", label: "My plan", prompt: "What plan am I on?" },
      { id: "bl-upgrade", label: "Should I upgrade?", prompt: "Should I upgrade?" },
      { id: "bl-billing", label: "View billing", href: ROUTES.billing },
    ],
  }
}
