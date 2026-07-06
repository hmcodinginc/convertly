/**
 * Site-level intent classification — distinct from per-page PageIntent.
 * Drives which rules contribute to scoring penalties for the whole website.
 */
export type WebsiteIntent =
  | "saas"
  | "agency"
  | "marketing"
  | "portfolio"
  | "commerce"
  | "ecommerce"
  | "blog"
  | "documentation"
  | "search_engine"
  | "developer_platform"
  | "open_source"
  | "dashboard"
  | "marketplace"
  | "community"
  | "unknown"

export type DetectedWebsiteIntent = {
  websiteIntent: WebsiteIntent
  confidence: number
  signals: string[]
}

export const WEBSITE_INTENT_LABELS: Record<WebsiteIntent, string> = {
  saas: "SaaS",
  agency: "Agency",
  marketing: "Marketing",
  portfolio: "Portfolio",
  commerce: "Commerce",
  ecommerce: "E-commerce",
  blog: "Blog",
  documentation: "Documentation",
  search_engine: "Search engine",
  developer_platform: "Developer platform",
  open_source: "Open source",
  dashboard: "Dashboard / app",
  marketplace: "Marketplace",
  community: "Community",
  unknown: "General website",
}

/** Intents that should not receive marketing/CRO rule penalties */
export const PLATFORM_WEBSITE_INTENTS: WebsiteIntent[] = [
  "search_engine",
  "developer_platform",
  "open_source",
  "documentation",
  "dashboard",
]

/**
 * Canonical non-CRO website intents — marketplace is distinct from ecommerce.
 * Ecommerce = merchant storefront. Marketplace = multi-vendor platform (Amazon, Etsy).
 */
export const NON_CRO_WEBSITE_INTENTS: WebsiteIntent[] = [
  ...PLATFORM_WEBSITE_INTENTS,
  "marketplace",
]

export function isNonCroWebsiteIntent(intent: WebsiteIntent): boolean {
  return NON_CRO_WEBSITE_INTENTS.includes(intent)
}

export const COMMERCIAL_WEBSITE_INTENTS: WebsiteIntent[] = [
  "saas",
  "agency",
  "marketing",
  "portfolio",
  "commerce",
  "ecommerce",
  "marketplace",
]
