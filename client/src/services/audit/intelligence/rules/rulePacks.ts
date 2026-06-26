import type { RulePageType } from "@/services/audit/intelligence/rules/rulePageType"
import { RULE_METADATA } from "@/services/audit/intelligence/rules/ruleMetadata"

export type RulePackId =
  | "shared.technical"
  | "shared.accessibility"
  | "homepage.conversion"
  | "homepage.trust"
  | "services.conversion"
  | "services.trust"
  | "services.content"
  | "about.trust"
  | "about.content"
  | "about.ux"
  | "pricing.pricing"
  | "pricing.conversion"
  | "pricing.trust"
  | "contact.conversion"
  | "contact.technical"
  | "projects.portfolio"
  | "projects.conversion"
  | "blog.seo"
  | "blog.content"
  | "legal.compliance"
  | "signup.conversion"
  | "login.conversion"
  | "site.navigation-trust"

export type RulePackDefinition = {
  id: RulePackId
  label: string
  description: string
}

export const RULE_PACKS: RulePackDefinition[] = [
  { id: "shared.technical", label: "Technical", description: "Viewport, DOM health, metadata, and mobile markup quality." },
  { id: "shared.accessibility", label: "Accessibility", description: "Touch targets, readability, and structural landmarks." },
  { id: "homepage.conversion", label: "Homepage conversion", description: "Hero, CTA, navigation, urgency, and lead capture." },
  { id: "homepage.trust", label: "Homepage trust", description: "Testimonials and social proof on the homepage." },
  { id: "services.conversion", label: "Services conversion", description: "Service page CTAs and inquiry paths." },
  { id: "services.trust", label: "Services trust", description: "Proof and credibility on service pages." },
  { id: "services.content", label: "Services content", description: "Depth, benefits, and internal linking on service pages." },
  { id: "about.trust", label: "About trust", description: "Mission, team, and credibility on about pages." },
  { id: "about.content", label: "About content", description: "Story depth and narrative quality." },
  { id: "about.ux", label: "About UX", description: "Contact paths and usability on about pages." },
  { id: "pricing.pricing", label: "Pricing clarity", description: "Plan structure and pricing communication." },
  { id: "pricing.conversion", label: "Pricing conversion", description: "Signup and purchase CTAs on pricing pages." },
  { id: "pricing.trust", label: "Pricing trust", description: "Proof near pricing decisions." },
  { id: "contact.conversion", label: "Contact conversion", description: "Forms, CTAs, and contact touchpoints." },
  { id: "contact.technical", label: "Contact technical", description: "Business information and contact completeness." },
  { id: "projects.portfolio", label: "Portfolio quality", description: "Case study depth, outcomes, and structure." },
  { id: "projects.conversion", label: "Projects conversion", description: "Portfolio CTAs and next-step paths." },
  { id: "blog.seo", label: "Blog SEO", description: "Titles, headings, and article structure." },
  { id: "blog.content", label: "Blog content", description: "Article depth and readability." },
  { id: "legal.compliance", label: "Legal compliance", description: "Policy depth, structure, and contact references." },
  { id: "signup.conversion", label: "Signup conversion", description: "Signup form presence and clarity." },
  { id: "login.conversion", label: "Login conversion", description: "Login form presence and clarity." },
  { id: "site.navigation-trust", label: "Site navigation & trust", description: "Cross-site legal, navigation, and linking checks." },
]

/** Page-type → rule packs executed during per-page analysis */
export const PAGE_TYPE_PACKS: Record<RulePageType, RulePackId[]> = {
  homepage: [
    "shared.technical",
    "shared.accessibility",
    "homepage.conversion",
    "homepage.trust",
  ],
  services: [
    "shared.technical",
    "shared.accessibility",
    "services.conversion",
    "services.trust",
    "services.content",
  ],
  features: [
    "shared.technical",
    "shared.accessibility",
    "services.conversion",
    "services.trust",
    "services.content",
  ],
  about: [
    "shared.technical",
    "shared.accessibility",
    "about.trust",
    "about.content",
    "about.ux",
  ],
  pricing: [
    "shared.technical",
    "shared.accessibility",
    "pricing.pricing",
    "pricing.conversion",
    "pricing.trust",
  ],
  contact: [
    "shared.technical",
    "shared.accessibility",
    "contact.conversion",
    "contact.technical",
  ],
  projects: [
    "shared.technical",
    "shared.accessibility",
    "projects.portfolio",
    "projects.conversion",
  ],
  blog: [
    "shared.technical",
    "shared.accessibility",
    "blog.seo",
    "blog.content",
  ],
  legal: [
    "shared.technical",
    "shared.accessibility",
    "legal.compliance",
  ],
  signup: ["shared.technical", "shared.accessibility", "signup.conversion"],
  login: ["shared.technical", "shared.accessibility", "login.conversion"],
  custom: ["shared.technical", "shared.accessibility"],
}

export const SITE_PACK_IDS: RulePackId[] = ["site.navigation-trust"]

const packById = new Map(RULE_PACKS.map((pack) => [pack.id, pack]))

const rulesByPack = new Map<RulePackId, string[]>()
for (const rule of RULE_METADATA) {
  for (const packId of rule.packIds) {
    const list = rulesByPack.get(packId) ?? []
    list.push(rule.id)
    rulesByPack.set(packId, list)
  }
}

export function getRulePack(id: RulePackId): RulePackDefinition | undefined {
  return packById.get(id)
}

export function getPackRuleIds(packId: RulePackId): string[] {
  return rulesByPack.get(packId) ?? []
}

export function getRuleIdsForPageType(pageType: RulePageType): string[] {
  const packIds = PAGE_TYPE_PACKS[pageType] ?? ["shared.technical", "shared.accessibility"]
  const ids = new Set<string>()
  for (const packId of packIds) {
    for (const ruleId of getPackRuleIds(packId)) {
      ids.add(ruleId)
    }
  }
  return [...ids].sort()
}

export function getSiteRuleIds(): string[] {
  const ids = new Set<string>()
  for (const packId of SITE_PACK_IDS) {
    for (const ruleId of getPackRuleIds(packId)) {
      ids.add(ruleId)
    }
  }
  return [...ids].sort()
}

export function countPageRulesForType(pageType: RulePageType): number {
  return getRuleIdsForPageType(pageType).length
}
