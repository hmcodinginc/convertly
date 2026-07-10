import { ROUTES } from "@/lib/routes"
import type { VertlyQuickAction } from "@/features/vertly/types"

export const VERTLY_NAV_ACTIONS = {
  audit: { id: "nav-audit", label: "Run Audit", href: ROUTES.auditNew },
  history: { id: "nav-history", label: "History", href: ROUTES.audits },
  billing: { id: "nav-billing", label: "Billing", href: ROUTES.billing },
  upgrade: { id: "nav-upgrade", label: "Upgrade", href: ROUTES.billing },
  settings: { id: "nav-settings", label: "Settings", href: ROUTES.settings },
  dashboard: { id: "nav-dashboard", label: "Dashboard", href: ROUTES.dashboard },
  workspace: { id: "nav-workspace", label: "Workspace", href: ROUTES.workspace },
} satisfies Record<string, VertlyQuickAction>

export function mergeQuickActions(
  primary: VertlyQuickAction[],
  ...extras: VertlyQuickAction[]
): VertlyQuickAction[] {
  const seen = new Set<string>()
  const merged: VertlyQuickAction[] = []

  for (const action of [...primary, ...extras]) {
    if (seen.has(action.id)) continue
    seen.add(action.id)
    merged.push(action)
  }

  return merged
}
