import { ROUTES } from "@/lib/routes"
import type { VertlyPageContext } from "@/features/vertly/types"

const BASE: Pick<VertlyPageContext, "suggestions" | "quickActions"> = {
  suggestions: [],
  quickActions: [],
}

function ctx(
  surface: VertlyPageContext["surface"],
  title: string,
  description: string,
  extras: Partial<VertlyPageContext> = {}
): VertlyPageContext {
  return { surface, title, description, ...BASE, ...extras }
}

export const MARKETING_HOME_CONTEXT = ctx(
  "marketing",
  "Convertly",
  "automated conversion intelligence",
  {
    suggestions: [
      { id: "m-what", label: "What is Convertly?", prompt: "What is Convertly?" },
      { id: "m-audit", label: "How do audits work?", prompt: "How do Convertly audits work?" },
      { id: "m-plans", label: "Pricing & plans", prompt: "What plans does Convertly offer?" },
      { id: "m-sample-q", label: "What is the sample report?", prompt: "What is the sample report?" },
      { id: "m-time", label: "How long do audits take?", prompt: "How long do audits take?" },
      { id: "m-safe", label: "Is my data safe?", prompt: "Is my data safe?" },
    ],
    quickActions: [
      { id: "m-signup", label: "Start free", href: ROUTES.signup },
      { id: "m-sample", label: "Sample report", href: ROUTES.sampleReport },
      { id: "m-login", label: "Sign in", href: ROUTES.login },
    ],
  }
)

export const SAMPLE_REPORT_VERTLY_CONTEXT = ctx(
  "sample-report",
  "Sample Report",
  "Explore a completed Convertly audit",
  {
    suggestions: [
      { id: "sr-explain", label: "Explain this report", prompt: "Explain this report." },
      { id: "sr-fix", label: "What to fix first", prompt: "Which issue should I fix first?" },
      { id: "sr-score", label: "Why this score?", prompt: "Why is my score low?" },
      { id: "sr-growth", label: "What is Growth Score?", prompt: "What is Growth Score?" },
      { id: "sr-confidence", label: "What is confidence?", prompt: "What is confidence?" },
      { id: "sr-audits", label: "How do audits work?", prompt: "How do Convertly audits work?" },
    ],
    quickActions: [
      { id: "sr-signup", label: "Start free audit", href: ROUTES.signup },
      { id: "sr-home", label: "Home", href: ROUTES.home },
    ],
  }
)

export function resolveMarketingContext(pathname: string): VertlyPageContext {
  if (pathname === ROUTES.sampleReport) return SAMPLE_REPORT_VERTLY_CONTEXT
  return MARKETING_HOME_CONTEXT
}
