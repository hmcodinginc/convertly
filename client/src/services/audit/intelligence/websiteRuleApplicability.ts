import { getRuleMetadata } from "@/services/audit/intelligence/rules/ruleMetadata"
import type { RulePackId } from "@/services/audit/intelligence/rules/rulePacks"
import type { WebsiteIntent } from "@/services/audit/intelligence/websiteIntentTypes"
import { PLATFORM_WEBSITE_INTENTS } from "@/services/audit/intelligence/websiteIntentTypes"

export type WebsiteRuleApplicabilitySpec = {
  applicableIntents: WebsiteIntent[] | "all"
  excludedIntents: WebsiteIntent[]
  optional: boolean
  priority: "critical" | "high" | "medium" | "low"
}

/** CRO / landing-page conversion intents (excludes marketplaces and platforms) */
const CRO_LANDING_INTENTS: WebsiteIntent[] = [
  "saas",
  "agency",
  "marketing",
  "commerce",
  "ecommerce",
]

const MARKETING_INTENTS: WebsiteIntent[] = [
  ...CRO_LANDING_INTENTS,
]
const COMMERCIAL_INTENTS: WebsiteIntent[] = [
  ...MARKETING_INTENTS,
  "portfolio",
  "community",
]
/** Contact / sales outreach — not for marketplaces or platforms */
const CONTACT_SALES_INTENTS: WebsiteIntent[] = [
  ...CRO_LANDING_INTENTS,
  "portfolio",
  "community",
]
const PLATFORM_INTENTS: WebsiteIntent[] = PLATFORM_WEBSITE_INTENTS

/** Pack-level defaults — rules inherit from their primary pack */
const PACK_WEBSITE_INTENT_DEFAULTS: Partial<Record<RulePackId, WebsiteIntent[] | "all">> = {
  "shared.technical": "all",
  "shared.accessibility": "all",
  "homepage.conversion": CRO_LANDING_INTENTS,
  "homepage.trust": CRO_LANDING_INTENTS,
  "services.conversion": ["agency", "portfolio", "saas", "commerce", "ecommerce", "marketing"],
  "services.trust": ["agency", "portfolio", "saas", "commerce", "ecommerce", "marketing"],
  "services.content": ["agency", "portfolio", "saas", "commerce", "ecommerce", "marketing"],
  "about.trust": COMMERCIAL_INTENTS,
  "about.content": COMMERCIAL_INTENTS,
  "about.ux": COMMERCIAL_INTENTS,
  "pricing.pricing": ["saas", "ecommerce"],
  "pricing.conversion": ["saas", "ecommerce"],
  "pricing.trust": ["saas", "ecommerce"],
  "contact.conversion": CONTACT_SALES_INTENTS,
  "contact.technical": CONTACT_SALES_INTENTS,
  "projects.portfolio": ["agency", "portfolio", "saas", "marketing"],
  "projects.conversion": ["agency", "portfolio", "saas", "marketing"],
  "blog.seo": ["blog", "saas", "agency", "community"],
  "blog.content": ["blog", "saas", "agency", "community"],
  "legal.compliance": "all",
  "signup.conversion": ["saas", "ecommerce", "community"],
  "login.conversion": "all",
  "site.navigation-trust": "all",
}

/** Sparse per-rule overrides for intent-aware scoring */
export const WEBSITE_RULE_APPLICABILITY_OVERRIDES: Partial<
  Record<string, Partial<WebsiteRuleApplicabilitySpec>>
> = {
  "hero-missing-primary-cta": {
    applicableIntents: CRO_LANDING_INTENTS,
    excludedIntents: [...PLATFORM_INTENTS, "marketplace"],
    optional: false,
    priority: "high",
  },
  "hero-no-value-proposition": {
    applicableIntents: CRO_LANDING_INTENTS,
    excludedIntents: [...PLATFORM_INTENTS, "marketplace"],
    optional: false,
    priority: "high",
  },
  "hero-generic-headline": {
    applicableIntents: CRO_LANDING_INTENTS,
    excludedIntents: [...PLATFORM_INTENTS, "marketplace"],
    optional: true,
    priority: "medium",
  },
  "hero-cta-below-fold": {
    applicableIntents: CRO_LANDING_INTENTS,
    excludedIntents: [...PLATFORM_INTENTS, "marketplace"],
    optional: false,
    priority: "high",
  },
  "hero-multiple-competing-ctas": {
    applicableIntents: CRO_LANDING_INTENTS,
    excludedIntents: ["search_engine", "documentation", "marketplace"],
    optional: true,
    priority: "medium",
  },
  "conversion-no-lead-capture": {
    applicableIntents: ["agency", "saas"],
    excludedIntents: [...PLATFORM_INTENTS, "ecommerce", "marketplace", "blog", "community"],
    optional: true,
    priority: "medium",
  },
  "conversion-no-urgency": {
    applicableIntents: ["saas", "ecommerce"],
    excludedIntents: PLATFORM_INTENTS,
    optional: true,
    priority: "low",
  },
  "conversion-weak-cta-language": {
    applicableIntents: CRO_LANDING_INTENTS,
    excludedIntents: [...PLATFORM_INTENTS, "marketplace"],
    optional: true,
    priority: "medium",
  },
  "trust-no-testimonials": {
    applicableIntents: ["agency", "saas", "ecommerce"],
    excludedIntents: PLATFORM_INTENTS,
    optional: true,
    priority: "low",
  },
  "trust-no-social-proof": {
    applicableIntents: ["agency", "saas", "ecommerce"],
    excludedIntents: PLATFORM_INTENTS,
    optional: true,
    priority: "low",
  },
  "trust-missing-contact-page": {
    applicableIntents: CONTACT_SALES_INTENTS,
    excludedIntents: ["search_engine", "developer_platform", "marketplace", "open_source", "dashboard"],
    optional: true,
    priority: "medium",
  },
  "site-missing-about-link": {
    applicableIntents: ["agency", "saas", "ecommerce"],
    excludedIntents: ["search_engine", "developer_platform", "documentation"],
    optional: true,
    priority: "low",
  },
  "site-missing-services-link": {
    applicableIntents: ["agency"],
    excludedIntents: PLATFORM_INTENTS,
    optional: true,
    priority: "medium",
  },
  "conversion-too-many-nav-links": {
    applicableIntents: COMMERCIAL_INTENTS,
    excludedIntents: ["search_engine"],
    optional: true,
    priority: "low",
  },
  "tech-thin-content": {
    applicableIntents: "all",
    excludedIntents: ["search_engine"],
    optional: true,
    priority: "low",
  },
}

/** Blockers that should not cap scores for specific website intents */
export const WEBSITE_INTENT_BLOCKER_EXCLUSIONS: Partial<
  Record<WebsiteIntent, string[]>
> = {
  search_engine: [
    "tech-missing-viewport",
    "hero-missing-primary-cta",
    "conversion-no-lead-capture",
    "trust-missing-contact-page",
    "trust-no-testimonials",
    "trust-no-social-proof",
    "site-footer-missing-legal",
    "site-missing-about-link",
    "site-missing-services-link",
  ],
  marketplace: [
    "tech-missing-viewport",
    "hero-missing-primary-cta",
    "hero-no-value-proposition",
    "hero-generic-headline",
    "hero-cta-below-fold",
    "hero-multiple-competing-ctas",
    "conversion-no-lead-capture",
    "conversion-no-urgency",
    "conversion-weak-cta-language",
    "trust-no-testimonials",
    "trust-no-social-proof",
    "trust-missing-contact-page",
    "contact-no-form",
    "contact-missing-cta",
  ],
  developer_platform: [
    "tech-missing-viewport",
    "hero-missing-primary-cta",
    "conversion-no-lead-capture",
    "trust-missing-contact-page",
    "trust-no-testimonials",
    "trust-no-social-proof",
    "conversion-no-urgency",
    "site-missing-about-link",
    "site-missing-services-link",
  ],
  documentation: [
    "hero-missing-primary-cta",
    "conversion-no-lead-capture",
    "trust-no-testimonials",
    "trust-no-social-proof",
  ],
  open_source: [
    "tech-missing-viewport",
    "hero-missing-primary-cta",
    "conversion-no-lead-capture",
    "trust-missing-contact-page",
    "trust-no-testimonials",
    "trust-no-social-proof",
    "conversion-no-urgency",
    "site-missing-about-link",
    "site-missing-services-link",
  ],
  dashboard: [
    "tech-missing-viewport",
    "hero-missing-primary-cta",
    "conversion-no-lead-capture",
    "trust-no-testimonials",
    "trust-no-social-proof",
    "trust-missing-contact-page",
  ],
  marketing: [],
  portfolio: [],
  commerce: [],
  blog: [
    "hero-missing-primary-cta",
    "conversion-no-lead-capture",
    "trust-no-testimonials",
  ],
}

function resolvePackDefaults(packIds: RulePackId[]): WebsiteIntent[] | "all" {
  for (const packId of packIds) {
    const defaults = PACK_WEBSITE_INTENT_DEFAULTS[packId]
    if (defaults) return defaults
  }
  return "all"
}

export function resolveWebsiteRuleApplicabilitySpec(
  ruleId: string
): WebsiteRuleApplicabilitySpec {
  const override = WEBSITE_RULE_APPLICABILITY_OVERRIDES[ruleId]
  const meta = getRuleMetadata(ruleId)

  if (!meta) {
    return {
      applicableIntents: "all",
      excludedIntents: [],
      optional: false,
      priority: "medium",
    }
  }

  const packDefaults = resolvePackDefaults(meta.packIds)

  return {
    applicableIntents: override?.applicableIntents ?? packDefaults,
    excludedIntents: override?.excludedIntents ?? [],
    optional: override?.optional ?? false,
    priority: override?.priority ?? priorityFromSeverity(meta.severity),
  }
}

function priorityFromSeverity(
  severity: import("@/types/auditEngine").FindingSeverity
): WebsiteRuleApplicabilitySpec["priority"] {
  switch (severity) {
    case "critical":
      return "critical"
    case "high":
      return "high"
    case "medium":
      return "medium"
    default:
      return "low"
  }
}

/**
 * Returns whether a rule is declared applicable for a website intent.
 * Used by the V5 Applicability Engine before execution (and by scoring as a safety net).
 */
export function isRuleApplicableToWebsiteIntent(
  ruleId: string,
  websiteIntent: WebsiteIntent
): boolean {
  const spec = resolveWebsiteRuleApplicabilitySpec(ruleId)

  if (spec.excludedIntents.includes(websiteIntent)) {
    return false
  }

  if (spec.applicableIntents === "all") {
    return true
  }

  return spec.applicableIntents.includes(websiteIntent)
}

export function isBlockerExcludedForWebsiteIntent(
  ruleId: string,
  websiteIntent: WebsiteIntent
): boolean {
  const exclusions = WEBSITE_INTENT_BLOCKER_EXCLUSIONS[websiteIntent] ?? []
  return exclusions.includes(ruleId)
}
