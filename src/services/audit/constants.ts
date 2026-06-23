import type { AuditPageType } from "@/types/auditEngine"

export type CommonPageDefinition = {
  pageType: AuditPageType
  paths: string[]
  title: string
}

/** Known public page paths — extend this list as discovery expands */
export const COMMON_PAGE_DEFINITIONS: CommonPageDefinition[] = [
  { pageType: "homepage", paths: ["/", "/home"], title: "Homepage" },
  { pageType: "pricing", paths: ["/pricing", "/plans", "/price"], title: "Pricing" },
  { pageType: "about", paths: ["/about", "/about-us", "/company"], title: "About" },
  { pageType: "contact", paths: ["/contact", "/contact-us"], title: "Contact" },
  { pageType: "services", paths: ["/services", "/solutions"], title: "Services" },
  { pageType: "features", paths: ["/features", "/product"], title: "Features" },
  { pageType: "login", paths: ["/login", "/sign-in", "/signin"], title: "Login" },
  { pageType: "signup", paths: ["/signup", "/sign-up", "/register", "/get-started"], title: "Signup" },
]

export const AUDIT_LOADING_PHASES = [
  "Discovering pages",
  "Reviewing user experience",
  "Checking conversion opportunities",
  "Evaluating trust signals",
  "Preparing recommendations",
] as const

export type AuditLoadingPhase = (typeof AUDIT_LOADING_PHASES)[number]

export const SCORE_CATEGORY_DEFINITIONS = [
  { category: "conversion" as const, label: "Conversion", maxScore: 100 },
  { category: "trust" as const, label: "Trust", maxScore: 100 },
  { category: "mobile" as const, label: "Mobile", maxScore: 100 },
  { category: "ux" as const, label: "UX", maxScore: 100 },
  { category: "growth" as const, label: "Growth Score", maxScore: 100 },
]

export const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const
export const MOBILE_VIEWPORT = { width: 390, height: 844 } as const
