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
        { id: "dash-read", label: "How do I read this dashboard?", prompt: "How should I read the audit dashboard?" },
        { id: "dash-first", label: "Run my first audit", prompt: "How do I run my first audit?" },
        { id: "dash-prioritize", label: "Prioritize opportunities", prompt: "How do I prioritize conversion opportunities?" },
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
          { id: "detail-score", label: "What does this score mean?", prompt: "What does this audit score mean?" },
          { id: "detail-fix", label: "What should I fix first?", prompt: "What should I fix first in this audit?" },
          { id: "detail-impact", label: "Estimated impact", prompt: "How should I interpret estimated lift on recommendations?" },
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
        { id: "ws-domain", label: "Add a domain", prompt: "How do I add a website domain to my workspace?" },
        { id: "ws-primary", label: "Primary domain", prompt: "What is a primary domain in Convertly?" },
        { id: "ws-team", label: "Team usage", prompt: "How does workspace setup affect audits?" },
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
          { id: "bill-plans", label: "Compare plans", prompt: "Help me compare Convertly plans." },
          { id: "bill-usage", label: "Audit allowance", prompt: "How does audit allowance work on my plan?" },
          { id: "bill-upgrade", label: "When to upgrade", prompt: "When should I upgrade my plan?" },
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
          { id: "prof-edit", label: "Update profile", prompt: "How do I update my profile?" },
          { id: "prof-email", label: "Email settings", prompt: "Where do I manage email-related settings?" },
        ],
        quickActions: mergeQuickActions(
          [VERTLY_NAV_ACTIONS.settings],
          VERTLY_NAV_ACTIONS.dashboard
        ),
      }),
      [ROUTES.settingsPreferences]: ctx("settings-preferences", "Preferences", "Default behavior", {
        suggestions: [
          { id: "pref-defaults", label: "Default settings", prompt: "What preferences should I configure first?" },
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
          ],
          quickActions: [VERTLY_NAV_ACTIONS.settings],
        }
      ),
      [ROUTES.settingsSecurity]: ctx("settings-security", "Security", "Password & access", {
        suggestions: [
          { id: "sec-password", label: "Change password", prompt: "How do I change my password?" },
        ],
        quickActions: [VERTLY_NAV_ACTIONS.settings],
      }),
      [ROUTES.settingsDangerZone]: ctx("settings-danger", "Danger zone", "Destructive actions", {
        suggestions: [
          { id: "danger-data", label: "Data removal", prompt: "What happens if I delete my account?" },
        ],
        quickActions: [VERTLY_NAV_ACTIONS.settings],
      }),
    }

    return (
      settingsMap[pathname] ??
      ctx("settings", "Settings", "Account preferences", {
        suggestions: [{ id: "settings-nav", label: "Navigate settings", prompt: "What can I manage in Settings?" }],
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
    ],
    quickActions: mergeQuickActions(
      [VERTLY_NAV_ACTIONS.dashboard, VERTLY_NAV_ACTIONS.audit],
      VERTLY_NAV_ACTIONS.billing,
      VERTLY_NAV_ACTIONS.settings
    ),
  })
}
