import type { VertlyPageContext, VertlySuggestion, VertlySurface } from "@/features/vertly/types"
import { buildPlaybookRelatedFromContext } from "@/features/vertly/content/playbookPageContext"

type SurfaceRelatedRule = {
  match: RegExp
  suggestions: VertlySuggestion[]
}

const SURFACE_RELATED: Partial<Record<VertlySurface, VertlySuggestion[]>> = {
  dashboard: [
    { id: "rel-dash-explain", label: "Explain metrics", prompt: "Explain this dashboard." },
    { id: "rel-dash-fix", label: "What to fix first", prompt: "Which issue should I fix first?" },
    { id: "rel-dash-audit", label: "Run an audit", prompt: "How do I run my first audit?" },
  ],
  "audit-detail": [
    { id: "rel-detail-explain", label: "Explain this audit", prompt: "Explain this audit." },
    { id: "rel-detail-score", label: "Why this score?", prompt: "Why is my score low?" },
    { id: "rel-detail-fix", label: "Fix first", prompt: "Which issue should I fix first?" },
  ],
  "recommendation-playbook": [],
  "audit-new": [
    { id: "rel-new-url", label: "Which URL first?", prompt: "Which URL should I audit first?" },
    { id: "rel-new-time", label: "How long?", prompt: "How long do audits take?" },
    { id: "rel-new-types", label: "Audit types", prompt: "Explain Full Funnel Audit." },
  ],
  audits: [
    { id: "rel-hist-counted", label: "Why counted?", prompt: "Why was this audit counted?" },
    { id: "rel-hist-compare", label: "Compare audits", prompt: "How do I compare past audits?" },
    { id: "rel-hist-rerun", label: "When to re-run", prompt: "When should I re-run an audit?" },
  ],
  workspace: [
    { id: "rel-ws-counted", label: "Why counted?", prompt: "Why was this audit counted?" },
    { id: "rel-ws-ledger", label: "Audit ledger", prompt: "Explain the audit ledger in workspace." },
    { id: "rel-ws-usage", label: "Usage breakdown", prompt: "How do I read workspace usage?" },
  ],
  billing: [
    { id: "rel-bill-plans", label: "Compare plans", prompt: "What plans does Convertly offer?" },
    { id: "rel-bill-limit", label: "Can't run audit?", prompt: "Why can't I run another audit?" },
    { id: "rel-bill-usage", label: "My allowance", prompt: "How many audits do I have left?" },
  ],
  "billing-return": [
    { id: "rel-bill-return", label: "Checkout status", prompt: "How does billing work?" },
    { id: "rel-bill-plans", label: "Compare plans", prompt: "What plans does Convertly offer?" },
    { id: "rel-bill-usage", label: "My allowance", prompt: "How many audits do I have left?" },
  ],
  settings: [
    { id: "rel-set-overview", label: "Settings overview", prompt: "What can I manage in Settings?" },
    { id: "rel-set-profile", label: "Update profile", prompt: "How do I update my profile?" },
    { id: "rel-set-security", label: "Security", prompt: "How do I manage account security?" },
  ],
  "settings-profile": [
    { id: "rel-prof-edit", label: "Update profile", prompt: "How do I update my profile?" },
    { id: "rel-prof-who", label: "Who am I?", prompt: "Who am I?" },
  ],
  "settings-preferences": [
    { id: "rel-pref-defaults", label: "Default settings", prompt: "What preferences should I configure first?" },
  ],
  "settings-notifications": [
    { id: "rel-notif-audit", label: "Audit alerts", prompt: "When do audit complete emails send?" },
    { id: "rel-notif-digest", label: "Weekly digest", prompt: "What is the weekly digest notification?" },
  ],
  "settings-security": [
    { id: "rel-sec-password", label: "Change password", prompt: "How do I change my password?" },
  ],
  "settings-danger": [
    { id: "rel-danger-data", label: "Data removal", prompt: "What happens if I delete my account?" },
  ],
  signup: [
    { id: "rel-signup-first", label: "What to do first", prompt: "What should I do after signing up?" },
    { id: "rel-signup-audit", label: "How audits work", prompt: "How do audits work?" },
  ],
  marketing: [
    { id: "rel-m-what", label: "What is Convertly?", prompt: "What is Convertly?" },
    { id: "rel-m-audit", label: "How audits work", prompt: "How do Convertly audits work?" },
    { id: "rel-m-plans", label: "Plans & pricing", prompt: "What plans does Convertly offer?" },
  ],
  "sample-report": [
    { id: "rel-sr-explain", label: "Explain report", prompt: "Explain this report." },
    { id: "rel-sr-fix", label: "What to fix first", prompt: "Which issue should I fix first?" },
    { id: "rel-sr-score", label: "Why this score?", prompt: "Why is my score low?" },
  ],
  generic: [
    { id: "rel-gen-audit", label: "Run an audit", prompt: "How do I run a conversion audit?" },
    { id: "rel-gen-plans", label: "Plans", prompt: "What plans does Convertly offer?" },
  ],
}

const SURFACE_REFINEMENTS: Partial<Record<VertlySurface, SurfaceRelatedRule[]>> = {
  dashboard: [
    {
      match: /\bscore\b|\bmetric\b/,
      suggestions: [
        { id: "rel-dash-score", label: "Explain metrics", prompt: "Explain this dashboard." },
        { id: "rel-dash-fix", label: "What to fix first", prompt: "Which issue should I fix first?" },
      ],
    },
  ],
  "audit-detail": [
    {
      match: /\bscore\b/,
      suggestions: [
        { id: "rel-detail-score", label: "Why this score?", prompt: "Why is my score low?" },
        { id: "rel-detail-fix", label: "Fix first", prompt: "Which issue should I fix first?" },
      ],
    },
    {
      match: /\brecommendation\b|\bfinding\b/,
      suggestions: [
        { id: "rel-detail-rec", label: "Explain recommendation", prompt: "What does this recommendation mean?" },
        { id: "rel-detail-finding", label: "Explain finding", prompt: "Explain this finding." },
      ],
    },
  ],
  billing: [
    {
      match: /\blimit\b|\bcan'?t run\b/,
      suggestions: [
        { id: "rel-bill-limit", label: "Can't run audit?", prompt: "Why can't I run another audit?" },
        { id: "rel-bill-usage", label: "My allowance", prompt: "How many audits do I have left?" },
      ],
    },
  ],
  workspace: [
    {
      match: /\bcounted\b|\bledger\b/,
      suggestions: [
        { id: "rel-ws-counted", label: "Why counted?", prompt: "Why was this audit counted?" },
        { id: "rel-ws-ledger", label: "Audit ledger", prompt: "Explain the audit ledger in workspace." },
      ],
    },
  ],
}

function resolveSurfaceRelated(surface: VertlySurface): VertlySuggestion[] {
  if (SURFACE_RELATED[surface]?.length) {
    return SURFACE_RELATED[surface]!
  }

  if (surface.startsWith("settings-")) {
    return SURFACE_RELATED[surface] ?? SURFACE_RELATED.settings ?? SURFACE_RELATED.generic ?? []
  }

  return SURFACE_RELATED.generic ?? []
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
  const refinements = SURFACE_REFINEMENTS[context.surface] ?? []

  if (normalized) {
    for (const rule of refinements) {
      if (rule.match.test(normalized)) {
        return dedupeSuggestions(rule.suggestions).slice(0, 4)
      }
    }
  }

  return dedupeSuggestions(resolveSurfaceRelated(context.surface)).slice(0, 4)
}

export function resolveRelatedSuggestions(
  messages: { role: string; content: string; suggestions?: VertlySuggestion[] }[],
  pageContext: VertlyPageContext,
  _isTyping: boolean
): VertlySuggestion[] {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.role === "user" && message.content.trim()) {
      return buildRelatedSuggestions(message.content, pageContext)
    }
  }

  return buildRelatedSuggestions("", pageContext)
}
