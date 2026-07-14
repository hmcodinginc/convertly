import type { VertlyPageContext } from "@/features/vertly/types"

const PLAYBOOK_LOADING: string[] = [
  "Analyzing recommendation...",
  "Reviewing implementation steps...",
  "Thinking through implementation...",
  "Preparing explanation...",
]

const AUDIT_DETAIL_LOADING: string[] = [
  "Reviewing audit...",
  "Analyzing findings...",
  "Prioritizing fixes...",
  "Preparing explanation...",
]

const DASHBOARD_LOADING: string[] = [
  "Reviewing your workspace...",
  "Analyzing recent signals...",
  "Thinking through next steps...",
  "Preparing explanation...",
]

const DEFAULT_LOADING: string[] = [
  "Thinking...",
  "Reviewing context...",
  "Preparing explanation...",
]

function resolveVertlyLoadingPhrases(pageContext: VertlyPageContext): string[] {
  switch (pageContext.surface) {
    case "recommendation-playbook":
      return PLAYBOOK_LOADING
    case "audit-detail":
    case "sample-report":
      return AUDIT_DETAIL_LOADING
    case "dashboard":
      return DASHBOARD_LOADING
    default:
      return DEFAULT_LOADING
  }
}

export { resolveVertlyLoadingPhrases }
