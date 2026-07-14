import type { AuditPageType } from "@/types/auditEngine"

export type PathTypeDefinition = {
  pageType: AuditPageType
  paths: string[]
  title: string
}

/** Path labels for discovered pages — not used to invent URLs */
export const PATH_TYPE_DEFINITIONS: PathTypeDefinition[] = [
  { pageType: "homepage", paths: ["/", "/home"], title: "Homepage" },
  { pageType: "pricing", paths: ["/pricing", "/plans", "/price"], title: "Pricing" },
  { pageType: "about", paths: ["/about", "/about-us", "/company"], title: "About" },
  { pageType: "contact", paths: ["/contact", "/contact-us"], title: "Contact" },
  { pageType: "services", paths: ["/services", "/solutions"], title: "Services" },
  { pageType: "features", paths: ["/features", "/product"], title: "Features" },
  { pageType: "login", paths: ["/login", "/sign-in", "/signin"], title: "Login" },
  { pageType: "signup", paths: ["/signup", "/sign-up", "/register", "/get-started"], title: "Signup" },
]

/** @deprecated Use PATH_TYPE_DEFINITIONS — kept for path label inference only */
export const COMMON_PAGE_DEFINITIONS = PATH_TYPE_DEFINITIONS

export function inferPageTypeFromPath(path: string): AuditPageType {
  const normalized = path.toLowerCase().replace(/\/$/, "") || "/"

  for (const definition of PATH_TYPE_DEFINITIONS) {
    if (definition.paths.some((candidate) => candidate.replace(/\/$/, "") === normalized)) {
      return definition.pageType
    }
  }

  return "custom"
}

export const SCORE_CATEGORY_DEFINITIONS = [
  { category: "conversion" as const, label: "Conversion", maxScore: 100 },
  { category: "trust" as const, label: "Trust", maxScore: 100 },
  { category: "mobile" as const, label: "Mobile", maxScore: 100 },
  { category: "ux" as const, label: "UX", maxScore: 100 },
  { category: "growth" as const, label: "Growth Score", maxScore: 100 },
  /** V3 auxiliary metrics — stored using legacy enum values for backward-compatible persistence */
  { category: "clarity" as const, label: "Audit Confidence", maxScore: 100 },
  { category: "overall" as const, label: "Growth Potential", maxScore: 100 },
  { category: "friction" as const, label: "Score Ceiling", maxScore: 100 },
]

export const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const
export const MOBILE_VIEWPORT = { width: 390, height: 844 } as const
