import type { FindingCategory } from "@/types/auditEngine"

/** Growth-intelligence categories — extensible beyond legacy finding categories */
export const INTELLIGENCE_CATEGORIES = [
  "conversion",
  "cta",
  "trust",
  "ux",
  "navigation",
  "copywriting",
  "forms",
  "pricing",
  "branding",
  "mobile",
  "accessibility",
  "performance",
  "seo",
  "security",
  "analytics",
  "content",
  "technical",
] as const

export type IntelligenceCategory = (typeof INTELLIGENCE_CATEGORIES)[number]

export const INTELLIGENCE_CATEGORY_LABELS: Record<IntelligenceCategory, string> = {
  conversion: "Conversion",
  cta: "CTA",
  trust: "Trust",
  ux: "UX",
  navigation: "Navigation",
  copywriting: "Copywriting",
  forms: "Forms",
  pricing: "Pricing",
  branding: "Branding",
  mobile: "Mobile",
  accessibility: "Accessibility",
  performance: "Performance",
  seo: "SEO",
  security: "Security",
  analytics: "Analytics",
  content: "Content",
  technical: "Technical",
}

export const INTELLIGENCE_CATEGORY_WEIGHTS: Record<IntelligenceCategory, number> = {
  conversion: 1,
  cta: 0.95,
  trust: 0.9,
  ux: 0.85,
  navigation: 0.75,
  copywriting: 0.8,
  forms: 0.85,
  pricing: 0.9,
  branding: 0.6,
  mobile: 0.85,
  accessibility: 0.7,
  performance: 0.75,
  seo: 0.65,
  security: 0.7,
  analytics: 0.55,
  content: 0.65,
  technical: 0.7,
}

const LEGACY_CATEGORY_MAP: Record<FindingCategory, IntelligenceCategory> = {
  ux: "ux",
  conversion: "conversion",
  trust: "trust",
  performance: "performance",
  copy: "copywriting",
  accessibility: "accessibility",
  technical: "technical",
}

export function toIntelligenceCategory(category: FindingCategory): IntelligenceCategory {
  return LEGACY_CATEGORY_MAP[category] ?? "technical"
}

export function isIntelligenceCategory(value: string): value is IntelligenceCategory {
  return INTELLIGENCE_CATEGORIES.includes(value as IntelligenceCategory)
}
