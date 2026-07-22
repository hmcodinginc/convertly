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
    { id: "rel-dash-growth", label: "Growth Score", prompt: "What is Growth Score?" },
    { id: "rel-dash-queue", label: "Opportunity queue", prompt: "What is the opportunity queue?" },
    { id: "rel-dash-usage", label: "Audits remaining", prompt: "How many audits do I have left?" },
  ],
  "audit-detail": [
    { id: "rel-detail-explain", label: "Explain this audit", prompt: "Explain this audit." },
    { id: "rel-detail-score", label: "Why this score?", prompt: "Why is my score low?" },
    { id: "rel-detail-fix", label: "Fix first", prompt: "Which issue should I fix first?" },
    { id: "rel-detail-growth", label: "Growth Score", prompt: "What is Growth Score?" },
    { id: "rel-detail-confidence", label: "Confidence", prompt: "What is confidence?" },
    { id: "rel-detail-pdf", label: "Export PDF", prompt: "How do I export a PDF report?" },
  ],
  "recommendation-playbook": [],
  "audit-new": [
    { id: "rel-new-url", label: "Which URL first?", prompt: "Which URL should I audit first?" },
    { id: "rel-new-time", label: "How long?", prompt: "How long do audits take?" },
    { id: "rel-new-types", label: "Audit types", prompt: "Explain Full Funnel Audit." },
    { id: "rel-new-pages", label: "Pages scanned", prompt: "What pages does Convertly scan during an audit?" },
    { id: "rel-new-draft", label: "Drafts", prompt: "How do drafts work?" },
    { id: "rel-new-count", label: "When counted?", prompt: "When do audits count against my allowance?" },
  ],
  audits: [
    { id: "rel-hist-counted", label: "Why counted?", prompt: "Why was this audit counted?" },
    { id: "rel-hist-compare", label: "Compare audits", prompt: "How do I compare past audits?" },
    { id: "rel-hist-rerun", label: "When to re-run", prompt: "When should I re-run an audit?" },
    { id: "rel-hist-share", label: "Share results", prompt: "How do I share audit results with my team?" },
    { id: "rel-hist-draft", label: "Drafts", prompt: "How do drafts work?" },
    { id: "rel-hist-pdf", label: "Export PDF", prompt: "How do I export a PDF report?" },
  ],
  workspace: [
    { id: "rel-ws-counted", label: "Why counted?", prompt: "Why was this audit counted?" },
    { id: "rel-ws-ledger", label: "Audit ledger", prompt: "Explain the audit ledger in workspace." },
    { id: "rel-ws-usage", label: "Usage breakdown", prompt: "How do I read workspace usage?" },
    { id: "rel-ws-reset", label: "Allowance reset", prompt: "When does my allowance reset?" },
    { id: "rel-ws-remaining", label: "Audits left", prompt: "How many audits do I have left?" },
    { id: "rel-ws-domains", label: "Domains", prompt: "How do I connect my website domain?" },
  ],
  billing: [
    { id: "rel-bill-plans", label: "Compare plans", prompt: "What plans does Convertly offer?" },
    { id: "rel-bill-limit", label: "Can't run audit?", prompt: "Why can't I run another audit?" },
    { id: "rel-bill-usage", label: "My allowance", prompt: "How many audits do I have left?" },
    { id: "rel-bill-mine", label: "My plan", prompt: "What plan am I on?" },
    { id: "rel-bill-renew", label: "Billing renewals", prompt: "How does billing work?" },
    { id: "rel-bill-upgrade", label: "Should I upgrade?", prompt: "Should I upgrade?" },
  ],
  "billing-return": [
    { id: "rel-bill-return", label: "Checkout status", prompt: "How does billing work?" },
    { id: "rel-bill-plans", label: "Compare plans", prompt: "What plans does Convertly offer?" },
    { id: "rel-bill-usage", label: "My allowance", prompt: "How many audits do I have left?" },
    { id: "rel-bill-mine", label: "My plan", prompt: "What plan am I on?" },
    { id: "rel-bill-upgrade", label: "Should I upgrade?", prompt: "Should I upgrade?" },
    { id: "rel-bill-audit", label: "Run an audit", prompt: "How do I run my first audit?" },
  ],
  settings: [
    { id: "rel-set-overview", label: "Settings overview", prompt: "What can I manage in Settings?" },
    { id: "rel-set-profile", label: "Update profile", prompt: "How do I update my profile?" },
    { id: "rel-set-security", label: "Security", prompt: "How do I manage account security?" },
    { id: "rel-set-notif", label: "Notifications", prompt: "What is the weekly digest notification?" },
    { id: "rel-set-password", label: "Change password", prompt: "How do I change my password?" },
    { id: "rel-set-plan", label: "My plan", prompt: "What plan am I on?" },
  ],
  "settings-profile": [
    { id: "rel-prof-edit", label: "Update profile", prompt: "How do I update my profile?" },
    { id: "rel-prof-who", label: "Who am I?", prompt: "Who am I?" },
    { id: "rel-prof-plan", label: "My plan", prompt: "What plan am I on?" },
    { id: "rel-prof-settings", label: "Settings overview", prompt: "What can I manage in Settings?" },
    { id: "rel-prof-security", label: "Security", prompt: "How do I manage account security?" },
  ],
  "settings-preferences": [
    { id: "rel-pref-defaults", label: "Default settings", prompt: "What preferences should I configure first?" },
    { id: "rel-pref-notif", label: "Notifications", prompt: "What is the weekly digest notification?" },
    { id: "rel-pref-profile", label: "Update profile", prompt: "How do I update my profile?" },
    { id: "rel-pref-settings", label: "Settings overview", prompt: "What can I manage in Settings?" },
  ],
  "settings-notifications": [
    { id: "rel-notif-audit", label: "Audit alerts", prompt: "When do audit complete emails send?" },
    { id: "rel-notif-digest", label: "Weekly digest", prompt: "What is the weekly digest notification?" },
    { id: "rel-notif-prefs", label: "Preferences", prompt: "What preferences should I configure first?" },
    { id: "rel-notif-safe", label: "Data safety", prompt: "Is my data safe?" },
    { id: "rel-notif-settings", label: "Settings overview", prompt: "What can I manage in Settings?" },
  ],
  "settings-security": [
    { id: "rel-sec-password", label: "Change password", prompt: "How do I change my password?" },
    { id: "rel-sec-safe", label: "Data safety", prompt: "Is my data safe?" },
    { id: "rel-sec-reset", label: "Password reset", prompt: "How does password reset work in Convertly?" },
    { id: "rel-sec-settings", label: "Settings overview", prompt: "What can I manage in Settings?" },
  ],
  "settings-danger": [
    { id: "rel-danger-data", label: "Data removal", prompt: "What happens if I delete my account?" },
    { id: "rel-danger-export", label: "Export PDF", prompt: "How do I export a PDF report?" },
    { id: "rel-danger-safe", label: "Data safety", prompt: "Is my data safe?" },
    { id: "rel-danger-settings", label: "Settings overview", prompt: "What can I manage in Settings?" },
  ],
  signup: [
    { id: "rel-signup-first", label: "What to do first", prompt: "What should I do after signing up?" },
    { id: "rel-signup-audit", label: "How audits work", prompt: "How do audits work?" },
    { id: "rel-signup-sample", label: "Sample report", prompt: "What is the sample report?" },
    { id: "rel-signup-plans", label: "Plans", prompt: "What plans does Convertly offer?" },
    { id: "rel-signup-safe", label: "Data safety", prompt: "Is my data safe?" },
    { id: "rel-signup-what", label: "What is Convertly?", prompt: "What does Convertly do?" },
  ],
  marketing: [
    { id: "rel-m-what", label: "What is Convertly?", prompt: "What is Convertly?" },
    { id: "rel-m-audit", label: "How audits work", prompt: "How do Convertly audits work?" },
    { id: "rel-m-plans", label: "Plans & pricing", prompt: "What plans does Convertly offer?" },
    { id: "rel-m-sample", label: "Sample report", prompt: "What is the sample report?" },
    { id: "rel-m-time", label: "How long?", prompt: "How long do audits take?" },
    { id: "rel-m-safe", label: "Data safety", prompt: "Is my data safe?" },
  ],
  "sample-report": [
    { id: "rel-sr-explain", label: "Explain report", prompt: "Explain this report." },
    { id: "rel-sr-fix", label: "What to fix first", prompt: "Which issue should I fix first?" },
    { id: "rel-sr-score", label: "Why this score?", prompt: "Why is my score low?" },
    { id: "rel-sr-growth", label: "Growth Score", prompt: "What is Growth Score?" },
    { id: "rel-sr-confidence", label: "Confidence", prompt: "What is confidence?" },
    { id: "rel-sr-audits", label: "How audits work", prompt: "How do Convertly audits work?" },
  ],
  login: [
    { id: "rel-login-what", label: "What Convertly does", prompt: "What does Convertly do?" },
    { id: "rel-login-audit", label: "How audits work", prompt: "How do website audits work in Convertly?" },
    { id: "rel-login-plans", label: "Plans", prompt: "What plans does Convertly offer?" },
    { id: "rel-login-sample", label: "Sample report", prompt: "What is the sample report?" },
    { id: "rel-login-signup", label: "Sign up", prompt: "How do I sign up?" },
  ],
  generic: [
    { id: "rel-gen-audit", label: "Run an audit", prompt: "How do I run a conversion audit?" },
    { id: "rel-gen-plans", label: "Plans", prompt: "What plans does Convertly offer?" },
    { id: "rel-gen-score", label: "Growth Score", prompt: "What is Growth Score?" },
    { id: "rel-gen-first", label: "Getting started", prompt: "What should I do after signing up?" },
    { id: "rel-gen-usage", label: "Audits left", prompt: "How many audits do I have left?" },
  ],
}

const SURFACE_REFINEMENTS: Partial<Record<VertlySurface, SurfaceRelatedRule[]>> = {
  dashboard: [
    {
      match: /\bscore\b|\bmetric\b/,
      suggestions: [
        { id: "rel-dash-score", label: "Explain metrics", prompt: "Explain this dashboard." },
        { id: "rel-dash-fix", label: "What to fix first", prompt: "Which issue should I fix first?" },
        { id: "rel-dash-growth", label: "Growth Score", prompt: "What is Growth Score?" },
        { id: "rel-dash-queue", label: "Opportunity queue", prompt: "What is the opportunity queue?" },
      ],
    },
  ],
  "audit-detail": [
    {
      match: /\bscore\b/,
      suggestions: [
        { id: "rel-detail-score", label: "Why this score?", prompt: "Why is my score low?" },
        { id: "rel-detail-fix", label: "Fix first", prompt: "Which issue should I fix first?" },
        { id: "rel-detail-growth", label: "Growth Score", prompt: "What is Growth Score?" },
        { id: "rel-detail-confidence", label: "Confidence", prompt: "What is confidence?" },
      ],
    },
    {
      match: /\brecommendation\b|\bfinding\b/,
      suggestions: [
        { id: "rel-detail-rec", label: "Explain recommendation", prompt: "What does this recommendation mean?" },
        { id: "rel-detail-finding", label: "Explain finding", prompt: "Explain this finding." },
        { id: "rel-detail-fix", label: "Fix first", prompt: "Which issue should I fix first?" },
        { id: "rel-detail-pdf", label: "Export PDF", prompt: "How do I export a PDF report?" },
      ],
    },
  ],
  billing: [
    {
      match: /\blimit\b|\bcan'?t run\b/,
      suggestions: [
        { id: "rel-bill-limit", label: "Can't run audit?", prompt: "Why can't I run another audit?" },
        { id: "rel-bill-usage", label: "My allowance", prompt: "How many audits do I have left?" },
        { id: "rel-bill-upgrade", label: "Should I upgrade?", prompt: "Should I upgrade?" },
        { id: "rel-bill-plans", label: "Compare plans", prompt: "What plans does Convertly offer?" },
      ],
    },
  ],
  workspace: [
    {
      match: /\bcounted\b|\bledger\b/,
      suggestions: [
        { id: "rel-ws-counted", label: "Why counted?", prompt: "Why was this audit counted?" },
        { id: "rel-ws-ledger", label: "Audit ledger", prompt: "Explain the audit ledger in workspace." },
        { id: "rel-ws-reset", label: "Allowance reset", prompt: "When does my allowance reset?" },
        { id: "rel-ws-remaining", label: "Audits left", prompt: "How many audits do I have left?" },
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
    return dedupeSuggestions(buildPlaybookRelatedFromContext(context)).slice(0, 6)
  }

  const normalized = message.trim().toLowerCase()
  const refinements = SURFACE_REFINEMENTS[context.surface] ?? []

  if (normalized) {
    for (const rule of refinements) {
      if (rule.match.test(normalized)) {
        return dedupeSuggestions(rule.suggestions).slice(0, 6)
      }
    }
  }

  return dedupeSuggestions(resolveSurfaceRelated(context.surface)).slice(0, 6)
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
