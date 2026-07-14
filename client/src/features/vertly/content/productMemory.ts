import {
  getEffectivePlanEntitlement,
  type EffectivePlanId,
} from "@/lib/billingPlans"
import type { VertlySurface } from "@/features/vertly/types"

export type ProductMemoryTopic =
  | "overview"
  | "audits"
  | "audit-types"
  | "audit-duration"
  | "billing"
  | "limits"
  | "reports"
  | "dashboard"
  | "workspace"
  | "settings"
  | "drafts"
  | "security"

const PRODUCT_KEYWORDS: Record<ProductMemoryTopic, RegExp[]> = {
  overview: [
    /\bwhat is convertly\b/,
    /\bconvertly do\b/,
    /\bhow does convertly work\b/,
    /\bwhat does convertly\b/,
    /\btell me about convertly\b/,
  ],
  audits: [
    /\bhow (do|does) audits work\b/,
    /\bwhat is an audit\b/,
    /\brun an audit\b/,
    /\baudit engine\b/,
    /\bre-?audit\b/,
    /\bstart (a|an) audit\b/,
  ],
  "audit-types": [
    /\baudit type\b/,
    /\bfull funnel audit\b/,
    /\bexplain (the )?full funnel\b/,
    /\bpage specific\b/,
    /\bcompetitive benchmark\b/,
    /\bcoming soon\b/,
    /\bdifference between\b.*\b(page specific|full funnel)\b/,
    /\bpage specific vs\b/,
  ],
  "audit-duration": [
    /\bhow long (do )?audits? (take|last|run)\b/,
    /\bhow long does (an )?audit (take|last|run)\b/,
    /\baudit (duration|timing|time)\b/,
  ],
  billing: [
    /\bhow (does|do) billing work\b/,
    /\bwhat plans\b/,
    /\bwhat plan options\b/,
    /\bpricing\b/,
    /\bupgrade\b/,
    /\bsubscription\b/,
    /\brazorpay\b/,
  ],
  limits: [
    /\baudit limit\b/,
    /\ballowance\b/,
    /\bcounted audit\b/,
    /\bnot counted\b/,
    /\bfailed audit count\b/,
    /\bwhen (does|do) audits count\b/,
  ],
  reports: [
    /\bpdf report\b/,
    /\bexport pdf\b/,
    /\baudit report\b/,
    /\bgrowth score\b/,
    /\brecommendations\b/,
    /\bplaybook\b/,
  ],
  dashboard: [/\bdashboard\b/, /\bopportunity queue\b/, /\bonboarding\b/],
  workspace: [/\bworkspace\b/, /\bdomains\b/, /\baudit ledger\b/],
  settings: [/\bsettings\b/, /\bprofile\b/, /\bnotifications\b/],
  drafts: [/\bdraft audit\b/, /\bsave as draft\b/],
  security: [
    /\bsecurity\b/,
    /\bprivacy\b/,
    /\bdata (safe|storage|retention)\b/,
    /\bwhat data (do you|does convertly) (store|collect)\b/,
  ],
}

function formatAnswer(parts: { answer: string; details?: string; context?: string }): string {
  const lines = [parts.answer]
  if (parts.details) lines.push(parts.details)
  if (parts.context) lines.push(parts.context)
  return lines.join("\n\n")
}

export function resolveProductMemoryTopic(message: string): ProductMemoryTopic | null {
  const normalized = message.trim().toLowerCase()

  for (const [topic, patterns] of Object.entries(PRODUCT_KEYWORDS) as [
    ProductMemoryTopic,
    RegExp[],
  ][]) {
    if (patterns.some((pattern) => pattern.test(normalized))) {
      return topic
    }
  }

  if (/\bconvertly\b/.test(normalized)) return "overview"
  return null
}

export function resolveProductMemoryTopicFromSurface(
  surface: VertlySurface
): ProductMemoryTopic | null {
  switch (surface) {
    case "dashboard":
      return "dashboard"
    case "billing":
    case "billing-return":
      return "billing"
    case "workspace":
    case "audits":
      return "workspace"
    case "audit-detail":
    case "audit-new":
    case "recommendation-playbook":
      return "audits"
    case "settings":
    case "settings-profile":
    case "settings-preferences":
    case "settings-notifications":
    case "settings-security":
    case "settings-danger":
      return "settings"
    default:
      return null
  }
}

function planAllowanceLabel(planId: EffectivePlanId): string {
  const plan = getEffectivePlanEntitlement(planId)
  return plan.period === "lifetime"
    ? `${plan.auditsPerPeriod} lifetime audits`
    : `${plan.auditsPerPeriod} audits per month`
}

export function buildProductMemoryAnswer(topic: ProductMemoryTopic): string {
  switch (topic) {
    case "overview":
      return formatAnswer({
        answer:
          "Convertly audits public website pages for conversion issues and returns a Growth Score with prioritized fixes.",
        details:
          "You add a URL, pick an audit type, review findings on the dashboard, and export a PDF report.",
        context: "Re-audit after changes to measure progress.",
      })
    case "audits":
      return formatAnswer({
        answer: "Audits scan public pages and score UX, copy, trust, and CTA clarity.",
        details: "Only completed audits consume allowance — drafts, failed runs, and in-progress audits do not.",
        context: "Results include page findings, site-wide issues, and recommendations.",
      })
    case "audit-types":
      return formatAnswer({
        answer:
          "**Full Funnel** crawls key funnel pages site-wide (~5–15 min). **Page Specific** analyzes one URL only (~few minutes).",
        details: "Use Full Funnel for a broad picture; Page Specific for a landing page or single-page check.",
        context: "Competitive Benchmark is marked Coming Soon in the app.",
      })
    case "audit-duration":
      return formatAnswer({
        answer: "Page Specific audits usually finish in a few minutes. Full Funnel typically takes 5–15 minutes.",
        details: "Time depends on site size — discovery (crawl) plus analysis and scoring.",
        context: "Live progress appears while a run is active.",
      })
    case "billing":
      return formatAnswer({
        answer: `Plans range from **Free** (${planAllowanceLabel("free")}) through **Scale** (${planAllowanceLabel("scale")}).`,
        details: "Paid plans renew monthly via Razorpay. Plan changes may apply at renewal.",
        context: "Open **Billing** to compare plans or manage your subscription.",
      })
    case "limits":
      return formatAnswer({
        answer: "Only completed audits count against your allowance.",
        details: "Drafts, failed runs, and in-progress audits do not consume allowance.",
        context: "When you hit your limit, new audits are blocked until renewal or upgrade. Check **Workspace** for the audit ledger.",
      })
    case "reports":
      return formatAnswer({
        answer: "Each completed audit includes a Growth Score, page findings, site-wide issues, and recommendations.",
        details: "Recommendations include priority and estimated lift where available.",
        context: "Export a PDF from audit detail actions.",
      })
    case "dashboard":
      return formatAnswer({
        answer: "The dashboard summarizes conversion health for your selected audit.",
        details: "You'll see metrics, prioritized insights, an opportunity queue, and AI recommendations.",
        context: "Draft audits and onboarding cards appear here when relevant.",
      })
    case "workspace":
      return formatAnswer({
        answer: "Workspace shows plan usage, the audit ledger, and monitored domains.",
        details: "The ledger lists every session with a **Counted** column for allowance reconciliation.",
        context: "Use it to trace completed, failed, draft, and running audits.",
      })
    case "settings":
      return formatAnswer({
        answer: "Settings covers profile, preferences, notifications, and security.",
        details: "Profile changes apply across your workspace without affecting audit history.",
        context: "Open the relevant settings section from the sidebar.",
      })
    case "drafts":
      return formatAnswer({
        answer: "Save as Draft stores URL and audit type without starting a run.",
        details: "Drafts show **Counted: No** on the dashboard and workspace ledger.",
        context: "Resume a draft to prefill New Audit — starting converts it instead of duplicating.",
      })
    case "security":
      return formatAnswer({
        answer: "Only public pages are analyzed — no login bypass or private area access.",
        details: "Audit data is tied to your workspace account.",
        context: "Manage account security under Settings → Security.",
      })
    default:
      return "Ask about audits, plans, workspace usage, or reports."
  }
}
