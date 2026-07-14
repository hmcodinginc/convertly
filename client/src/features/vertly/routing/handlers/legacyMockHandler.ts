import { buildRelatedSuggestions } from "@/features/vertly/content/relatedQuestions"
import { ROUTES } from "@/lib/routes"
import type {
  VertlyConversationRequest,
  VertlyConversationResponse,
  VertlyPageContext,
} from "@/features/vertly/types"

function pageIntro(context: VertlyPageContext): string {
  const meta = context.metadata ?? {}
  const auditLine =
    context.surface === "audit-detail" && meta.domain
      ? ` You are reviewing **${meta.domain}**${meta.score != null ? ` (score ${meta.score})` : ""}.`
      : ""

  return `**${context.title}** — ${context.description}${auditLine}`
}

/** Legacy surface-aware responses — preserved as general in-app assistant fallback. */
export function buildLegacyMockResponse(
  request: VertlyConversationRequest
): VertlyConversationResponse {
  const { message, context } = request
  const normalized = message.trim().toLowerCase()
  const intro = pageIntro(context)
  const related = buildRelatedSuggestions(message, context)

  if (context.surface === "signup") {
    if (normalized.includes("convertly") || normalized.includes("what")) {
      return {
        content: `${intro}\n\nConvertly analyzes your website like a conversion specialist. We scan key funnel pages, surface prioritized issues, and explain what to fix — with AI recommendations tied to business impact.\n\nAfter you create an account, your first step is running an audit on your primary domain.`,
        suggestions: related,
      }
    }
    if (normalized.includes("audit")) {
      return {
        content: `${intro}\n\nAudits scan your marketing and product funnel pages — homepage, pricing, signup, checkout — and score them for clarity, trust, and friction.\n\nEach report includes prioritized issues and specific recommendations you can action immediately.`,
        suggestions: related,
      }
    }
  }

  if (context.surface === "dashboard") {
    if (normalized.includes("score") || normalized.includes("metric")) {
      return {
        content: `${intro}\n\nYour overall score reflects conversion health across scanned pages. Higher scores mean fewer critical friction points.\n\nFocus on critical and high-severity issues first — they typically drive the largest modeled lift.`,
        suggestions: related,
      }
    }
    return {
      content: `${intro}\n\nUse the dashboard to track audit health at a glance: metrics summarize the selected report, the opportunity queue highlights high-impact fixes, and recommendations translate findings into next steps.\n\nIf this is your first visit, run an audit to populate live data.`,
      suggestions: related,
    }
  }

  if (context.surface === "audit-new") {
    return {
      content: `${intro}\n\nEnter the root domain you want to evaluate — typically your marketing site or product homepage. Convertly discovers key paths (pricing, signup, checkout) and analyzes them for clarity, trust, and friction.\n\nAudits usually complete in a few minutes depending on site size.`,
      suggestions: related,
    }
  }

  if (context.surface === "audits") {
    return {
      content: `${intro}\n\nEach row is a completed audit you can reopen. Compare scores over time to see whether conversion improvements are landing. Re-run audits after meaningful site changes.`,
      suggestions: related,
    }
  }

  if (context.surface === "audit-detail") {
    const score = context.metadata?.score
    const domain = context.metadata?.domain

    if (normalized.includes("score") || normalized.includes("mean")) {
      return {
        content: `${intro}\n\nThe overall score summarizes conversion health across all scanned pages on ${domain ?? "this site"}. It weighs severity, page importance, and modeled impact.\n\nScores below 70 often indicate multiple high-friction points on key funnel pages.${score != null ? `\n\nThis report scored **${score}**.` : ""}`,
        suggestions: related,
      }
    }

    if (normalized.includes("improve") || normalized.includes("fix")) {
      return {
        content: `${intro}\n\nStart with critical issues on high-traffic pages — homepage, pricing, and signup flows usually drive the most lift.\n\nEach recommendation includes specific copy, layout, and UX guidance. Implement top items, then re-run the audit to measure progress.`,
        suggestions: related,
      }
    }

    if (normalized.includes("page")) {
      return {
        content: `${intro}\n\nPage-level scores show which URLs drag down the overall result. Pricing and signup pages often have outsized impact because they sit closest to conversion.\n\nOpen each page finding to see issues scoped to that URL.`,
        suggestions: related,
      }
    }

    if (normalized.includes("example")) {
      return {
        content: `${intro}\n\nCommon high-impact fixes include clearer value propositions above the fold, stronger trust signals near CTAs, and reducing form friction on signup flows.\n\nCheck the prioritized issues section for examples tailored to this audit.`,
        suggestions: related,
      }
    }

    return {
      content: `${intro}\n\nStart with the overall score, then review prioritized issues — they are ranked by severity and modeled impact. Recommendations include specific copy, layout, and UX guidance you can action immediately.${score != null ? `\n\nThis report scored **${score}**. Focus on critical and high-severity items first.` : ""}`,
      suggestions: related,
    }
  }

  if (context.surface === "workspace") {
    return {
      content: `${intro}\n\nDomains connect your audits to the websites you manage. Add your primary domain first so reports stay organized as you scale.\n\nWorkspace settings stay separate from billing — manage plans on the Billing page.`,
      suggestions: related,
    }
  }

  if (context.surface === "billing" || context.surface === "billing-return") {
    if (normalized.includes("upgrade") || normalized.includes("plan")) {
      return {
        content: `${intro}\n\nPaid plans unlock recurring monthly audits and higher limits. Upgrade when you are consistently hitting your allowance or need to monitor multiple domains.\n\nUsage updates automatically after each audit completes.`,
        suggestions: related,
      }
    }
    return {
      content: `${intro}\n\nYour plan controls monthly audit allowance. The Free plan includes a small lifetime allowance to explore Convertly; paid plans unlock recurring audits and higher limits.\n\nUsage updates automatically after each audit.`,
      suggestions: related,
    }
  }

  if (context.surface.startsWith("settings")) {
    return {
      content: `${intro}\n\nSettings let you tune notifications, security, and account preferences without affecting your audit data. Profile changes apply across the workspace.`,
      suggestions: related,
    }
  }

  return {
    content: `${intro}\n\nI can explain audits, dashboard insights, workspace setup, billing, or settings. Ask a specific question or choose a suggestion below.`,
    suggestions: related.length
      ? related
      : [
          { id: "gen-audit", label: "Run an audit", prompt: "How do I run a conversion audit?" },
          {
            id: "gen-billing",
            label: "Plans & billing",
            prompt: "Explain Convertly plans and billing.",
            href: ROUTES.billing,
          },
        ],
  }
}
