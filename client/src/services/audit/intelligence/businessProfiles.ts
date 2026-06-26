import type { IntelligenceCategory } from "@/services/audit/intelligence/categories"

export const BUSINESS_PROFILE_TYPES = [
  "saas",
  "agency",
  "portfolio",
  "restaurant",
  "healthcare",
  "law_firm",
  "local_business",
  "ecommerce",
  "startup",
  "landing_page",
  "blog",
  "general",
] as const

export type BusinessProfileType = (typeof BUSINESS_PROFILE_TYPES)[number]

export type BusinessProfileDefinition = {
  id: BusinessProfileType
  label: string
  description: string
  /** Categories emphasized for future profile-aware scoring */
  priorityCategories: IntelligenceCategory[]
  /** Reserved for future rule-set filtering */
  suggestedRuleTags: string[]
}

export const BUSINESS_PROFILES: Record<BusinessProfileType, BusinessProfileDefinition> = {
  saas: {
    id: "saas",
    label: "SaaS",
    description: "Software products with trial/signup conversion paths",
    priorityCategories: ["conversion", "cta", "pricing", "forms", "trust"],
    suggestedRuleTags: ["saas", "signup", "pricing"],
  },
  agency: {
    id: "agency",
    label: "Agency",
    description: "Service businesses selling expertise and outcomes",
    priorityCategories: ["trust", "conversion", "cta", "content", "branding"],
    suggestedRuleTags: ["agency", "contact", "portfolio"],
  },
  portfolio: {
    id: "portfolio",
    label: "Portfolio",
    description: "Personal or studio showcase sites",
    priorityCategories: ["branding", "content", "cta", "ux", "mobile"],
    suggestedRuleTags: ["portfolio", "showcase"],
  },
  restaurant: {
    id: "restaurant",
    label: "Restaurant",
    description: "Hospitality and local dining businesses",
    priorityCategories: ["conversion", "mobile", "content", "trust", "forms"],
    suggestedRuleTags: ["local", "menu", "reservations"],
  },
  healthcare: {
    id: "healthcare",
    label: "Healthcare",
    description: "Clinics, providers, and health services",
    priorityCategories: ["trust", "accessibility", "forms", "security", "content"],
    suggestedRuleTags: ["healthcare", "compliance"],
  },
  law_firm: {
    id: "law_firm",
    label: "Law Firm",
    description: "Legal practices and professional services",
    priorityCategories: ["trust", "conversion", "forms", "content", "branding"],
    suggestedRuleTags: ["legal", "consultation"],
  },
  local_business: {
    id: "local_business",
    label: "Local Business",
    description: "Location-based service providers",
    priorityCategories: ["conversion", "trust", "mobile", "forms", "seo"],
    suggestedRuleTags: ["local", "contact"],
  },
  ecommerce: {
    id: "ecommerce",
    label: "Ecommerce",
    description: "Online stores and product catalogs",
    priorityCategories: ["conversion", "pricing", "trust", "performance", "mobile"],
    suggestedRuleTags: ["ecommerce", "checkout", "product"],
  },
  startup: {
    id: "startup",
    label: "Startup",
    description: "Early-stage growth-focused websites",
    priorityCategories: ["conversion", "cta", "copywriting", "trust", "analytics"],
    suggestedRuleTags: ["startup", "waitlist"],
  },
  landing_page: {
    id: "landing_page",
    label: "Landing Page",
    description: "Single-offer campaign pages",
    priorityCategories: ["conversion", "cta", "copywriting", "forms", "performance"],
    suggestedRuleTags: ["landing", "campaign"],
  },
  blog: {
    id: "blog",
    label: "Blog",
    description: "Content-led publishers and media sites",
    priorityCategories: ["content", "seo", "navigation", "performance", "analytics"],
    suggestedRuleTags: ["blog", "content"],
  },
  general: {
    id: "general",
    label: "General",
    description: "Default profile when business type is unknown",
    priorityCategories: ["conversion", "trust", "ux", "mobile", "performance"],
    suggestedRuleTags: [],
  },
}

export const DEFAULT_BUSINESS_PROFILE: BusinessProfileType = "general"

export function getBusinessProfile(
  profile: BusinessProfileType = DEFAULT_BUSINESS_PROFILE
): BusinessProfileDefinition {
  return BUSINESS_PROFILES[profile]
}
