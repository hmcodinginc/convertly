import {
  getEffectivePlanEntitlement,
  type EffectivePlanId,
} from "@/lib/billingPlans"

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
  | "getting-started"
  | "first-audit"
  | "url-selection"
  | "pages-scanned"
  | "history-compare"
  | "reaudit"
  | "share-export"
  | "opportunity-queue"
  | "notifications"
  | "profile"
  | "password"
  | "account-deletion"
  | "confidence"
  | "growth-score"

/**
 * Keyword order matters: more specific topics are listed first so they win
 * over broader ones like "audits" / "overview".
 */
const PRODUCT_KEYWORDS: Record<ProductMemoryTopic, RegExp[]> = {
  "getting-started": [
    /\bafter signing up\b/,
    /\bwhat should i do (first|after)\b/,
    /\bgetting started\b/,
    /\bfirst steps?\b/,
  ],
  "first-audit": [
    /\brun my first audit\b/,
    /\bhow do i run (my )?(first |a )?audit\b/,
    /\bstart (a |an |my )?(first )?audit\b/,
    /\bhow do i start a new audit\b/,
  ],
  "url-selection": [
    /\bwhich url should i audit\b/,
    /\bwhat url should i\b/,
    /\bwhich (page|url) (to|should i) (audit|scan)\b/,
  ],
  "pages-scanned": [
    /\bwhat pages (are|does|do).*(scan|audit)\b/,
    /\bpages (does|do) convertly scan\b/,
    /\bwhich pages (are|get) (scanned|audited)\b/,
  ],
  "history-compare": [
    /\bcompare (past |previous )?audits\b/,
    /\bhow do i compare\b/,
    /\baudit (history|comparison)\b/,
  ],
  reaudit: [
    /\bwhen (should|do) i re-?run\b/,
    /\bre-?run an audit\b/,
    /\breaudit\b/,
    /\brun (another|again)\b.*\baudit\b/,
  ],
  "share-export": [
    /\bshare (audit )?results\b/,
    /\bexport (a |an |the )?pdf\b/,
    /\bpdf report\b/,
    /\bdownload (the )?report\b/,
    /\bshare with (my )?team\b/,
  ],
  "opportunity-queue": [
    /\bopportunity queue\b/,
    /\bwhat (is|are) (the )?quick wins?\b/,
    /\bexplain (the )?opportunity\b/,
  ],
  notifications: [
    /\bweekly digest\b/,
    /\baudit (complete|completed) (emails?|alerts?)\b/,
    /\bnotification(s)?\b/,
    /\bemail alerts?\b/,
  ],
  profile: [
    /\bupdate my profile\b/,
    /\bhow do i update (my )?profile\b/,
    /\bedit (my )?profile\b/,
  ],
  password: [
    /\bchange (my )?password\b/,
    /\bpassword reset\b/,
    /\breset (my )?password\b/,
    /\bstrong password\b/,
    /\bhow does password reset\b/,
  ],
  "account-deletion": [
    /\bdelete my account\b/,
    /\bdata removal\b/,
    /\bwhat happens if i delete\b/,
  ],
  confidence: [
    /\bwhat (is|'?s) confidence\b/,
    /\bexplain confidence\b/,
    /\bconfidence (score|level|mean)\b/,
  ],
  "growth-score": [
    /\bwhat (is|'?s) (the )?growth score\b/,
    /\bexplain (the )?growth score\b/,
  ],
  overview: [
    /\bwhat is convertly\b/,
    /\bconvertly do\b/,
    /\bhow does convertly work\b/,
    /\bwhat does convertly\b/,
    /\btell me about convertly\b/,
  ],
  audits: [
    /\bhow (do|does) audits work\b/,
    /\bhow (do|does) (website |convertly )?audits work\b/,
    /\bwhat is an audit\b/,
    /\brun an audit\b/,
    /\baudit engine\b/,
    /\bstart (a|an) audit\b/,
    /\bhow do i run a conversion audit\b/,
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
    /\bhow long does (an |a convertly )?audit (take|last|run)\b/,
    /\baudit (duration|timing|time)\b/,
  ],
  billing: [
    /\bhow (does|do) billing work\b/,
    /\bwhat plans\b/,
    /\bwhat plan options\b/,
    /\bplans and billing\b/,
    /\bconvertly plans\b/,
    /\bpricing\b/,
    /\bupgrade\b/,
    /\bsubscription\b/,
    /\brazorpay\b/,
    /\bbilling renew\b/,
    /\bshould i upgrade\b/,
  ],
  limits: [
    /\baudit limit\b/,
    /\ballowance\b/,
    /\bcounted audit\b/,
    /\bnot counted\b/,
    /\bfailed audit count\b/,
    /\bwhen (does|do) audits count\b/,
    /\baudits count against\b/,
    /\ballowance reset\b/,
    /\bwhen does (my )?allowance reset\b/,
  ],
  reports: [
    /\baudit report\b/,
    /\brecommendations\b/,
    /\bplaybook\b/,
    /\bwhat are (findings|recommendations)\b/,
  ],
  dashboard: [/\bdashboard\b/, /\bonboarding\b/, /\bexplain (this|the) dashboard\b/],
  workspace: [
    /\bworkspace\b/,
    /\bdomains\b/,
    /\baudit ledger\b/,
    /\bmonitored domains?\b/,
    /\bconnect (my )?(website|domain)\b/,
  ],
  settings: [/\bsettings\b/, /\bwhat can i manage in settings\b/, /\bpreferences should i configure\b/],
  drafts: [/\bdraft audit\b/, /\bsave as draft\b/, /\bhow do drafts work\b/, /\bwhat is a draft\b/],
  security: [
    /\bsecurity\b/,
    /\bprivacy\b/,
    /\bdata (safe|storage|retention)\b/,
    /\bwhat data (do you|does convertly) (store|collect)\b/,
    /\bis my data safe\b/,
    /\bmanage account security\b/,
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
        details: "You'll see metrics, prioritized insights, an opportunity queue, and prioritized recommendations.",
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
    case "getting-started":
      return formatAnswer({
        answer: "After signup, run your first audit from **New Audit** with your primary website URL.",
        details: "Review the Growth Score and top recommendations, then fix the highest-impact issues first.",
        context: "You can also open the **sample report** to see what a finished audit looks like.",
      })
    case "first-audit":
      return formatAnswer({
        answer: "Open **New Audit**, paste a public URL, choose Full Funnel or Page Specific, then start the run.",
        details: "Keep the browser tab open while the audit runs — progress updates live.",
        context: "Completed audits appear on the dashboard and in Audit History.",
      })
    case "url-selection":
      return formatAnswer({
        answer: "Start with your homepage or highest-traffic landing page — the page visitors hit first.",
        details: "Use **Page Specific** for one critical URL; use **Full Funnel** when you want key funnel pages together.",
        context: "Pick a public URL Convertly can load without login.",
      })
    case "pages-scanned":
      return formatAnswer({
        answer: "**Page Specific** analyzes the URL you enter. **Full Funnel** discovers and audits key funnel pages from that starting URL.",
        details: "Coverage depends on crawl discovery — public links and reachable pages only.",
        context: "Private or login-walled pages are not scanned.",
      })
    case "history-compare":
      return formatAnswer({
        answer: "Open **Audit History** to browse past runs, then open two reports side by side to compare Growth Score and findings.",
        details: "The dashboard trend also compares against your previous completed audit when one exists.",
        context: "Re-run after shipping fixes to measure lift.",
      })
    case "reaudit":
      return formatAnswer({
        answer: "Re-run after you ship meaningful conversion fixes — CTA, trust, forms, or mobile friction changes.",
        details: "Avoid re-running immediately unless you need a fresh baseline; each completed run uses allowance.",
        context: "Compare the new Growth Score and finding counts against the previous report.",
      })
    case "share-export":
      return formatAnswer({
        answer: "Export a **PDF report** from the audit detail actions and share that file with your team.",
        details: "The PDF includes Growth Score, findings, and prioritized recommendations.",
        context: "Teammates can also sign in to the same workspace to open live reports.",
      })
    case "opportunity-queue":
      return formatAnswer({
        answer: "The **Opportunity Queue** highlights quick wins — high-impact, lower-effort fixes from your latest audit.",
        details: "Use it when you want the fastest path to conversion improvement this week.",
        context: "Open a recommendation for full playbook guidance.",
      })
    case "notifications":
      return formatAnswer({
        answer: "**Audit complete** emails notify you when a run finishes. The **weekly digest** summarizes recent activity.",
        details: "Toggle these under Settings → Notifications without changing your audits.",
        context: "Delivery respects your saved notification preferences.",
      })
    case "profile":
      return formatAnswer({
        answer: "Update your name and account identity under **Settings → Profile**.",
        details: "Profile edits do not change audit history or plan entitlement.",
        context: "Your email is managed through your Convertly account authentication.",
      })
    case "password":
      return formatAnswer({
        answer: "Change your password under **Settings → Security**, or use **Forgot password** on the login page.",
        details: "Use a long unique password — at least 12 characters with mixed character types.",
        context: "Reset emails go to your account email address.",
      })
    case "account-deletion":
      return formatAnswer({
        answer: "Deleting your account removes workspace access and associated Convertly data for that account.",
        details: "This is permanent — export any PDF reports you need before deleting.",
        context: "Account deletion lives under Settings → Danger zone.",
      })
    case "confidence":
      return formatAnswer({
        answer:
          "**Confidence** reflects how reliable the audit signals are for that run — based on crawl coverage, data completeness, and related diagnostics.",
        details:
          "**High** means a strong evidence base. **Medium** is useful with some limits. **Low** means treat findings more carefully.",
        context: "It does not replace the Growth Score; it tells you how much to trust the evidence behind it.",
      })
    case "growth-score":
      return formatAnswer({
        answer:
          "**Growth Score** measures overall conversion readiness and weighted business impact. It is not based solely on the number of issues.",
        details: "Higher-weight conversion blockers influence the score more than many low-impact findings.",
        context: "Track it over re-audits to measure progress after you ship fixes.",
      })
    default:
      return "Ask about audits, plans, workspace usage, or reports."
  }
}
