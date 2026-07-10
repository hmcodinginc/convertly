import type { VertlyPageContext, VertlySuggestion, VertlySurface } from "@/features/vertly/types"
import { buildPlaybookRelatedFromContext } from "@/features/vertly/content/playbookPageContext"

type RelatedRule = {
  match: RegExp
  suggestions: VertlySuggestion[]
}

const SCORE_CHAIN: VertlySuggestion[] = [
  {
    id: "rel-improve-score",
    label: "How do I improve it?",
    prompt: "How do I improve my audit score?",
  },
  {
    id: "rel-pages-score",
    label: "What pages affect it?",
    prompt: "Which pages most affect my overall score?",
  },
  {
    id: "rel-score-examples",
    label: "Show examples",
    prompt: "Show me examples of high-impact fixes for my score.",
  },
]

const ISSUE_CHAIN: VertlySuggestion[] = [
  {
    id: "rel-fix-first",
    label: "What should I fix first?",
    prompt: "What should I fix first in this audit?",
  },
  {
    id: "rel-issue-impact",
    label: "Estimated impact",
    prompt: "How should I interpret estimated lift on recommendations?",
  },
  {
    id: "rel-issue-examples",
    label: "Show examples",
    prompt: "Show me examples of similar fixes that worked.",
  },
]

const PLAN_CHAIN: VertlySuggestion[] = [
  {
    id: "rel-compare-plans",
    label: "Compare plans",
    prompt: "Help me compare Convertly plans.",
  },
  {
    id: "rel-when-upgrade",
    label: "When to upgrade?",
    prompt: "When should I upgrade my plan?",
  },
  {
    id: "rel-usage-limits",
    label: "Audit allowance",
    prompt: "How does audit allowance work on my plan?",
  },
]

const AUDIT_RUN_CHAIN: VertlySuggestion[] = [
  {
    id: "rel-audit-url",
    label: "Which URL first?",
    prompt: "Which URL should I audit first?",
  },
  {
    id: "rel-audit-time",
    label: "How long does it take?",
    prompt: "How long does a Convertly audit take?",
  },
  {
    id: "rel-audit-pages",
    label: "What gets scanned?",
    prompt: "What pages does Convertly scan during an audit?",
  },
]

const GLOBAL_RULES: RelatedRule[] = [
  { match: /\bscore\b|\boverall\b|\brating\b|\bgrade\b/, suggestions: SCORE_CHAIN },
  {
    match: /\bimprove\b|\bbetter\b|\bincrease\b|\blift\b|\boptimize\b/,
    suggestions: [
      {
        id: "rel-prioritize",
        label: "Prioritize fixes",
        prompt: "How do I prioritize conversion fixes?",
      },
      {
        id: "rel-quick-wins",
        label: "Quick wins",
        prompt: "What are quick wins I can implement today?",
      },
      {
        id: "rel-measure",
        label: "Measure results",
        prompt: "How do I measure whether my changes worked?",
      },
    ],
  },
  {
    match: /\bfix\b|\bissue\b|\brecommendation\b|\bproblem\b/,
    suggestions: ISSUE_CHAIN,
  },
  {
    match: /\bplan\b|\bbilling\b|\bupgrade\b|\bsubscription\b|\blimit\b/,
    suggestions: PLAN_CHAIN,
  },
  {
    match: /\baudit\b|\bscan\b|\brun\b|\bdomain\b|\burl\b/,
    suggestions: AUDIT_RUN_CHAIN,
  },
  {
    match: /\bdashboard\b|\bmetric\b|\boverview\b/,
    suggestions: [
      {
        id: "rel-dash-read",
        label: "Explain metrics",
        prompt: "Explain the dashboard metrics.",
      },
      {
        id: "rel-dash-prioritize",
        label: "Prioritize opportunities",
        prompt: "How do I prioritize conversion opportunities?",
      },
      {
        id: "rel-dash-audit",
        label: "Run an audit",
        prompt: "How do I run my first audit?",
      },
    ],
  },
  {
    match: /\bworkspace\b|\bdomain\b|\borganization\b|\bteam\b/,
    suggestions: [
      {
        id: "rel-ws-domain",
        label: "Add a domain",
        prompt: "How do I add a website domain to my workspace?",
      },
      {
        id: "rel-ws-primary",
        label: "Primary domain",
        prompt: "What is a primary domain in Convertly?",
      },
      {
        id: "rel-ws-audit",
        label: "Run an audit",
        prompt: "How do I run an audit from my workspace?",
      },
    ],
  },
  {
    match: /\bsetting\b|\bprofile\b|\bpassword\b|\bnotification\b/,
    suggestions: [
      {
        id: "rel-settings-nav",
        label: "Navigate settings",
        prompt: "What can I manage in Settings?",
      },
      {
        id: "rel-settings-security",
        label: "Security options",
        prompt: "How do I manage account security?",
      },
      {
        id: "rel-settings-notify",
        label: "Notification prefs",
        prompt: "How do I control audit notification emails?",
      },
    ],
  },
]

const SURFACE_DEFAULTS: Partial<Record<VertlySurface, VertlySuggestion[]>> = {
  signup: [
    {
      id: "rel-signup-first",
      label: "What should I do first?",
      prompt: "What should I do after signing up?",
    },
    {
      id: "rel-signup-audit",
      label: "How do audits work?",
      prompt: "How do website audits work in Convertly?",
    },
  ],
  dashboard: [
    {
      id: "rel-dash-first-audit",
      label: "Run my first audit",
      prompt: "How do I run my first audit?",
    },
    {
      id: "rel-dash-read",
      label: "Read the dashboard",
      prompt: "How should I read the audit dashboard?",
    },
  ],
  "audit-new": AUDIT_RUN_CHAIN,
  audits: [
    {
      id: "rel-hist-compare",
      label: "Compare past audits",
      prompt: "How do I compare past audits?",
    },
    {
      id: "rel-hist-rerun",
      label: "When to re-run",
      prompt: "When should I re-run an audit?",
    },
  ],
  "audit-detail": ISSUE_CHAIN,
  "recommendation-playbook": [],
  workspace: [
    {
      id: "rel-ws-add",
      label: "Add a domain",
      prompt: "How do I add a website domain to my workspace?",
    },
    {
      id: "rel-ws-setup",
      label: "Workspace setup",
      prompt: "How does workspace setup affect audits?",
    },
  ],
  billing: PLAN_CHAIN,
  "billing-return": PLAN_CHAIN,
  settings: [
    {
      id: "rel-settings-overview",
      label: "Settings overview",
      prompt: "What can I manage in Settings?",
    },
  ],
  generic: [
    {
      id: "rel-gen-audit",
      label: "Run an audit",
      prompt: "How do I run a conversion audit?",
    },
    {
      id: "rel-gen-billing",
      label: "Plans & billing",
      prompt: "Explain Convertly plans and billing.",
    },
  ],
}

function dedupeSuggestions(suggestions: VertlySuggestion[]): VertlySuggestion[] {
  const seen = new Set<string>()
  return suggestions.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export function buildRelatedSuggestions(
  message: string,
  context: VertlyPageContext
): VertlySuggestion[] {
  if (context.surface === "recommendation-playbook") {
    return dedupeSuggestions(buildPlaybookRelatedFromContext(context)).slice(0, 4)
  }

  const normalized = message.trim().toLowerCase()

  for (const rule of GLOBAL_RULES) {
    if (rule.match.test(normalized)) {
      return dedupeSuggestions(rule.suggestions).slice(0, 4)
    }
  }

  const surfaceDefaults = SURFACE_DEFAULTS[context.surface] ?? SURFACE_DEFAULTS.generic ?? []
  return dedupeSuggestions(surfaceDefaults).slice(0, 3)
}

export function getLatestRelatedSuggestions(messages: { role: string; content: string; suggestions?: VertlySuggestion[] }[]): VertlySuggestion[] {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (
      message.role === "assistant" &&
      message.content.trim() &&
      message.suggestions &&
      message.suggestions.length > 0
    ) {
      return message.suggestions
    }
  }
  return []
}

export function resolveRelatedSuggestions(
  messages: { role: string; content: string; suggestions?: VertlySuggestion[] }[],
  pageContext: VertlyPageContext,
  isTyping: boolean
): VertlySuggestion[] {
  const latest = getLatestRelatedSuggestions(messages)
  if (isTyping && latest.length > 0) return latest
  if (latest.length > 0) return latest

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.role === "user" && message.content.trim()) {
      return buildRelatedSuggestions(message.content, pageContext)
    }
  }

  return buildRelatedSuggestions("", pageContext)
}
