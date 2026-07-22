import { ROUTES } from "@/lib/routes"
import { mergeQuickActions, VERTLY_NAV_ACTIONS } from "@/features/vertly/content/navActions"
import type { VertlyPageContext, VertlySurface } from "@/features/vertly/types"

const BASE: Pick<VertlyPageContext, "suggestions" | "quickActions"> = {
  suggestions: [],
  quickActions: [],
}

function ctx(
  surface: VertlySurface,
  title: string,
  description: string,
  extras: Partial<VertlyPageContext> = {}
): VertlyPageContext {
  return { surface, title, description, ...BASE, ...extras }
}

export const SIGNUP_CONTEXT = ctx(
  "signup",
  "Sign up",
  "Getting started with Convertly",
  {
    suggestions: [
      { id: "signup-what", label: "What does Convertly do?", prompt: "What does Convertly do?" },
      { id: "signup-audit", label: "How do audits work?", prompt: "How do website audits work in Convertly?" },
      { id: "signup-start", label: "What should I do first?", prompt: "What should I do after signing up?" },
      { id: "signup-sample-q", label: "What is the sample report?", prompt: "What is the sample report?" },
      { id: "signup-plans", label: "Pricing & plans", prompt: "What plans does Convertly offer?" },
      { id: "signup-safe", label: "Is my data safe?", prompt: "Is my data safe?" },
    ],
    quickActions: [
      { id: "signup-sample", label: "View sample report", href: ROUTES.sampleReport },
      VERTLY_NAV_ACTIONS.audit,
    ],
  }
)

export function resolveRouteContext(pathname: string): VertlyPageContext {
  if (pathname === ROUTES.dashboard) {
    return ctx("dashboard", "Dashboard", "Monitoring your workspace", {
      suggestions: [
        { id: "dash-read", label: "Explain this dashboard", prompt: "Explain this dashboard." },
        { id: "dash-first", label: "Run my first audit", prompt: "How do I run my first audit?" },
        { id: "dash-prioritize", label: "What to fix first", prompt: "Which issue should I fix first?" },
        { id: "dash-score", label: "What is Growth Score?", prompt: "What is Growth Score?" },
        { id: "dash-queue", label: "Opportunity queue", prompt: "What is the opportunity queue?" },
        { id: "dash-usage", label: "Audits remaining", prompt: "How many audits do I have left?" },
      ],
      quickActions: mergeQuickActions(
        [VERTLY_NAV_ACTIONS.audit, VERTLY_NAV_ACTIONS.history],
        VERTLY_NAV_ACTIONS.billing,
        VERTLY_NAV_ACTIONS.settings
      ),
      proactive: {
        id: "dash-proactive-audit",
        label: "Run your first audit to populate this dashboard.",
        href: ROUTES.auditNew,
      },
    })
  }

  if (pathname === ROUTES.auditNew) {
    return ctx("audit-new", "New Audit", "Starting a conversion scan", {
      suggestions: [
        { id: "audit-url", label: "Which URL should I audit?", prompt: "Which URL should I audit first?" },
        { id: "audit-time", label: "How long does an audit take?", prompt: "How long does a Convertly audit take?" },
        { id: "audit-pages", label: "What pages are scanned?", prompt: "What pages does Convertly scan during an audit?" },
        { id: "audit-types", label: "Audit types", prompt: "Explain Full Funnel Audit." },
        { id: "audit-draft", label: "How do drafts work?", prompt: "How do drafts work?" },
        { id: "audit-count", label: "When do audits count?", prompt: "When do audits count against my allowance?" },
      ],
      quickActions: mergeQuickActions(
        [VERTLY_NAV_ACTIONS.history, VERTLY_NAV_ACTIONS.dashboard],
        VERTLY_NAV_ACTIONS.settings
      ),
    })
  }

  if (pathname === ROUTES.audits) {
    return ctx("audits", "Audit History", "Browsing past reports", {
      suggestions: [
        { id: "hist-compare", label: "Compare past audits", prompt: "How do I compare past audits?" },
        { id: "hist-rerun", label: "When to re-run", prompt: "When should I re-run an audit?" },
        { id: "hist-share", label: "Share results", prompt: "How do I share audit results with my team?" },
        { id: "hist-counted", label: "Why was this counted?", prompt: "Why was this audit counted?" },
        { id: "hist-draft", label: "How do drafts work?", prompt: "How do drafts work?" },
        { id: "hist-pdf", label: "Export a PDF", prompt: "How do I export a PDF report?" },
      ],
      quickActions: mergeQuickActions(
        [VERTLY_NAV_ACTIONS.audit, VERTLY_NAV_ACTIONS.dashboard],
        VERTLY_NAV_ACTIONS.billing
      ),
    })
  }

  if (pathname.startsWith("/audits/")) {
    return ctx(
      "audit-detail",
      "Audit",
      "Reviewing your website",
      {
        suggestions: [
          { id: "detail-explain", label: "Explain this audit", prompt: "Explain this audit." },
          { id: "detail-fix", label: "What should I fix first?", prompt: "Which issue should I fix first?" },
          { id: "detail-score", label: "Why is my score low?", prompt: "Why is my score low?" },
          { id: "detail-growth", label: "What is Growth Score?", prompt: "What is Growth Score?" },
          { id: "detail-confidence", label: "What is confidence?", prompt: "What is confidence?" },
          { id: "detail-pdf", label: "Export a PDF", prompt: "How do I export a PDF report?" },
        ],
        quickActions: mergeQuickActions(
          [VERTLY_NAV_ACTIONS.audit, VERTLY_NAV_ACTIONS.history],
          VERTLY_NAV_ACTIONS.dashboard
        ),
      }
    )
  }

  if (pathname === ROUTES.workspace) {
    return ctx("workspace", "Workspace", "Organization settings", {
      suggestions: [
        { id: "ws-counted", label: "Why was this counted?", prompt: "Why was this audit counted?" },
        { id: "ws-ledger", label: "Audit ledger", prompt: "Explain the audit ledger in workspace." },
        { id: "ws-usage", label: "My usage breakdown", prompt: "How do I read workspace usage?" },
        { id: "ws-reset", label: "When does allowance reset?", prompt: "When does my allowance reset?" },
        { id: "ws-remaining", label: "Audits remaining", prompt: "How many audits do I have left?" },
        { id: "ws-domains", label: "Monitored domains", prompt: "How do I connect my website domain?" },
      ],
      quickActions: mergeQuickActions(
        [VERTLY_NAV_ACTIONS.audit, VERTLY_NAV_ACTIONS.settings],
        VERTLY_NAV_ACTIONS.billing
      ),
      proactive: {
        id: "ws-proactive-domain",
        label: "Connect your website in Workspace before scaling audits.",
        href: ROUTES.workspace,
      },
    })
  }

  if (pathname === ROUTES.billing || pathname === ROUTES.billingReturn) {
    return ctx(
      pathname === ROUTES.billingReturn ? "billing-return" : "billing",
      "Billing",
      "Managing subscription",
      {
        suggestions: [
          { id: "bill-plans", label: "Compare plans", prompt: "What plans does Convertly offer?" },
          { id: "bill-limit", label: "Why can't I run another audit?", prompt: "Why can't I run another audit?" },
          { id: "bill-usage", label: "My audit allowance", prompt: "How many audits do I have left?" },
          { id: "bill-mine", label: "What plan am I on?", prompt: "What plan am I on?" },
          { id: "bill-renew", label: "How does billing renew?", prompt: "How does billing work?" },
          { id: "bill-upgrade", label: "Should I upgrade?", prompt: "Should I upgrade?" },
        ],
        quickActions: mergeQuickActions(
          [VERTLY_NAV_ACTIONS.upgrade, VERTLY_NAV_ACTIONS.audit],
          VERTLY_NAV_ACTIONS.settings,
          VERTLY_NAV_ACTIONS.dashboard
        ),
        proactive: {
          id: "bill-proactive-limit",
          label: "If you are near your audit limit, upgrading unlocks more monthly audits.",
          href: ROUTES.billing,
        },
      }
    )
  }

  if (pathname.startsWith(ROUTES.settings)) {
    const settingsMap: Record<string, VertlyPageContext> = {
      [ROUTES.settingsProfile]: ctx("settings-profile", "Profile", "Account identity", {
        suggestions: [
          { id: "prof-edit", label: "Update my profile", prompt: "How do I update my profile?" },
          { id: "prof-who", label: "Who am I?", prompt: "Who am I?" },
          { id: "prof-plan", label: "What plan am I on?", prompt: "What plan am I on?" },
          { id: "prof-settings", label: "What can Settings do?", prompt: "What can I manage in Settings?" },
          { id: "prof-security", label: "Account security", prompt: "How do I manage account security?" },
        ],
        quickActions: mergeQuickActions(
          [VERTLY_NAV_ACTIONS.settings],
          VERTLY_NAV_ACTIONS.dashboard
        ),
      }),
      [ROUTES.settingsPreferences]: ctx("settings-preferences", "Preferences", "Default behavior", {
        suggestions: [
          { id: "pref-defaults", label: "Default settings", prompt: "What preferences should I configure first?" },
          { id: "pref-notif", label: "Notification settings", prompt: "What is the weekly digest notification?" },
          { id: "pref-profile", label: "Update profile", prompt: "How do I update my profile?" },
          { id: "pref-settings", label: "Settings overview", prompt: "What can I manage in Settings?" },
        ],
        quickActions: mergeQuickActions(
          [{ id: "pref-notifications", label: "Notifications", href: ROUTES.settingsNotifications }],
          VERTLY_NAV_ACTIONS.dashboard
        ),
      }),
      [ROUTES.settingsNotifications]: ctx(
        "settings-notifications",
        "Notifications",
        "Email alerts & digests",
        {
          suggestions: [
            { id: "notif-digest", label: "Weekly digest", prompt: "What is the weekly digest notification?" },
            { id: "notif-audit", label: "Audit alerts", prompt: "When do audit complete emails send?" },
            { id: "notif-prefs", label: "Where are preferences?", prompt: "What preferences should I configure first?" },
            { id: "notif-safe", label: "Is my data safe?", prompt: "Is my data safe?" },
            { id: "notif-settings", label: "Settings overview", prompt: "What can I manage in Settings?" },
          ],
          quickActions: [VERTLY_NAV_ACTIONS.settings],
        }
      ),
      [ROUTES.settingsSecurity]: ctx("settings-security", "Security", "Password & access", {
        suggestions: [
          { id: "sec-password", label: "Change password", prompt: "How do I change my password?" },
          { id: "sec-safe", label: "Is my data safe?", prompt: "Is my data safe?" },
          { id: "sec-reset", label: "Password reset", prompt: "How does password reset work in Convertly?" },
          { id: "sec-settings", label: "Settings overview", prompt: "What can I manage in Settings?" },
        ],
        quickActions: [VERTLY_NAV_ACTIONS.settings],
      }),
      [ROUTES.settingsDangerZone]: ctx("settings-danger", "Danger zone", "Destructive actions", {
        suggestions: [
          { id: "danger-data", label: "Data removal", prompt: "What happens if I delete my account?" },
          { id: "danger-export", label: "Export a PDF first", prompt: "How do I export a PDF report?" },
          { id: "danger-safe", label: "Is my data safe?", prompt: "Is my data safe?" },
          { id: "danger-settings", label: "Settings overview", prompt: "What can I manage in Settings?" },
        ],
        quickActions: [VERTLY_NAV_ACTIONS.settings],
      }),
    }

    return (
      settingsMap[pathname] ??
      ctx("settings", "Settings", "Account preferences", {
        suggestions: [
          { id: "settings-nav", label: "Navigate settings", prompt: "What can I manage in Settings?" },
          { id: "settings-profile", label: "Update profile", prompt: "How do I update my profile?" },
          { id: "settings-notif", label: "Notifications", prompt: "What is the weekly digest notification?" },
          { id: "settings-security", label: "Change password", prompt: "How do I change my password?" },
        ],
        quickActions: mergeQuickActions(
          [{ id: "settings-profile", label: "Profile", href: ROUTES.settingsProfile }],
          VERTLY_NAV_ACTIONS.dashboard
        ),
      })
    )
  }

  return ctx("generic", "Convertly", "Your conversion workspace", {
    suggestions: [
      { id: "gen-audit", label: "Run an audit", prompt: "How do I run a conversion audit?" },
      { id: "gen-billing", label: "Plans & billing", prompt: "Explain Convertly plans and billing." },
      { id: "gen-score", label: "What is Growth Score?", prompt: "What is Growth Score?" },
      { id: "gen-first", label: "Getting started", prompt: "What should I do after signing up?" },
      { id: "gen-usage", label: "Audits remaining", prompt: "How many audits do I have left?" },
    ],
    quickActions: mergeQuickActions(
      [VERTLY_NAV_ACTIONS.dashboard, VERTLY_NAV_ACTIONS.audit],
      VERTLY_NAV_ACTIONS.billing,
      VERTLY_NAV_ACTIONS.settings
    ),
  })
}
