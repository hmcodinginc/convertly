import type { FindingSeverity, FindingCategory } from "@/types/auditEngine"
import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import type { BusinessImpactLevel } from "@/services/audit/intelligence/types"
import type { RulePackId } from "@/services/audit/intelligence/rules/rulePacks"
import type { RuleScope } from "@/services/audit/intelligence/rules/ruleDefinition"

export type RuleMetadata = {
  id: string
  scope: RuleScope
  packIds: RulePackId[]
  category: FindingCategory
  severity: FindingSeverity
  scoreCategory: ScoreCategory
  businessImpact: BusinessImpactLevel
  weight: number
  tags: string[]
  title: string
}

function meta(
  id: string,
  partial: Omit<RuleMetadata, "id">
): RuleMetadata {
  return { id, ...partial }
}

export const RULE_METADATA: RuleMetadata[] = [
  // Shared technical
  meta("tech-missing-viewport", { scope: "page", packIds: ["shared.technical"], category: "technical", severity: "high", scoreCategory: "mobile", businessImpact: "high", weight: 1, tags: ["mobile", "technical"], title: "Missing viewport meta" }),
  meta("tech-horizontal-overflow", { scope: "page", packIds: ["shared.technical"], category: "technical", severity: "high", scoreCategory: "mobile", businessImpact: "high", weight: 1, tags: ["mobile"], title: "Horizontal overflow risk" }),
  meta("tech-oversized-images", { scope: "page", packIds: ["shared.technical"], category: "performance", severity: "medium", scoreCategory: "mobile", businessImpact: "medium", weight: 0.85, tags: ["performance"], title: "Oversized images" }),
  meta("tech-thin-content", { scope: "page", packIds: ["shared.technical"], category: "ux", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.8, tags: ["content"], title: "Thin page content" }),
  meta("tech-missing-h1", { scope: "page", packIds: ["shared.technical"], category: "ux", severity: "high", scoreCategory: "ux", businessImpact: "high", weight: 0.95, tags: ["headings"], title: "Missing H1 heading" }),
  meta("tech-weak-heading-structure", { scope: "page", packIds: ["shared.technical"], category: "ux", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.8, tags: ["headings"], title: "Weak heading structure" }),
  meta("tech-missing-meta-description", { scope: "page", packIds: ["shared.technical"], category: "technical", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.75, tags: ["seo"], title: "Missing meta description" }),
  meta("tech-missing-page-title", { scope: "page", packIds: ["shared.technical"], category: "technical", severity: "high", scoreCategory: "ux", businessImpact: "high", weight: 0.9, tags: ["seo"], title: "Missing page title" }),
  meta("tech-heavy-dom", { scope: "page", packIds: ["shared.technical"], category: "performance", severity: "medium", scoreCategory: "mobile", businessImpact: "medium", weight: 0.7, tags: ["performance"], title: "Heavy DOM payload" }),

  // Shared accessibility
  meta("a11y-small-touch-targets", { scope: "page", packIds: ["shared.accessibility"], category: "accessibility", severity: "medium", scoreCategory: "mobile", businessImpact: "medium", weight: 0.9, tags: ["accessibility"], title: "Small touch targets" }),
  meta("a11y-small-font-sizes", { scope: "page", packIds: ["shared.accessibility"], category: "accessibility", severity: "medium", scoreCategory: "mobile", businessImpact: "medium", weight: 0.85, tags: ["accessibility"], title: "Font size readability risk" }),
  meta("a11y-missing-landmarks", { scope: "page", packIds: ["shared.accessibility"], category: "accessibility", severity: "low", scoreCategory: "ux", businessImpact: "low", weight: 0.6, tags: ["accessibility"], title: "Missing page landmarks" }),

  // Homepage conversion
  meta("hero-missing-primary-cta", { scope: "page", packIds: ["homepage.conversion"], category: "conversion", severity: "high", scoreCategory: "conversion", businessImpact: "high", weight: 1.1, tags: ["cta", "hero"], title: "Missing primary CTA" }),
  meta("hero-multiple-competing-ctas", { scope: "page", packIds: ["homepage.conversion"], category: "ux", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.9, tags: ["cta"], title: "Multiple competing CTAs" }),
  meta("hero-cta-below-fold", { scope: "page", packIds: ["homepage.conversion"], category: "conversion", severity: "high", scoreCategory: "conversion", businessImpact: "high", weight: 1, tags: ["cta"], title: "Hero CTA below fold" }),
  meta("hero-generic-headline", { scope: "page", packIds: ["homepage.conversion"], category: "copy", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.85, tags: ["copy"], title: "Generic headline" }),
  meta("hero-no-value-proposition", { scope: "page", packIds: ["homepage.conversion"], category: "copy", severity: "high", scoreCategory: "ux", businessImpact: "high", weight: 1, tags: ["copy"], title: "No value proposition" }),
  meta("conversion-weak-cta-language", { scope: "page", packIds: ["homepage.conversion"], category: "copy", severity: "medium", scoreCategory: "conversion", businessImpact: "medium", weight: 0.9, tags: ["cta"], title: "Weak CTA language" }),
  meta("conversion-too-many-nav-links", { scope: "page", packIds: ["homepage.conversion"], category: "ux", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.8, tags: ["navigation"], title: "Too many navigation links" }),
  meta("conversion-no-urgency", { scope: "page", packIds: ["homepage.conversion"], category: "conversion", severity: "low", scoreCategory: "conversion", businessImpact: "low", weight: 0.6, tags: ["conversion"], title: "No urgency indicators" }),
  meta("conversion-no-lead-capture", { scope: "page", packIds: ["homepage.conversion"], category: "conversion", severity: "high", scoreCategory: "conversion", businessImpact: "high", weight: 1.05, tags: ["forms"], title: "No lead capture" }),

  // Homepage trust
  meta("trust-no-testimonials", { scope: "page", packIds: ["homepage.trust"], category: "trust", severity: "medium", scoreCategory: "trust", businessImpact: "medium", weight: 0.85, tags: ["trust"], title: "No testimonials" }),
  meta("trust-no-social-proof", { scope: "page", packIds: ["homepage.trust"], category: "trust", severity: "medium", scoreCategory: "trust", businessImpact: "medium", weight: 0.85, tags: ["trust"], title: "No social proof" }),

  // Services
  meta("services-thin-page", { scope: "page", packIds: ["services.content"], category: "ux", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.85, tags: ["services"], title: "Thin services page" }),
  meta("services-missing-cta", { scope: "page", packIds: ["services.conversion"], category: "conversion", severity: "high", scoreCategory: "conversion", businessImpact: "high", weight: 1, tags: ["services", "cta"], title: "Missing services CTA" }),
  meta("services-unclear-offering", { scope: "page", packIds: ["services.content"], category: "ux", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.9, tags: ["services"], title: "Unclear service offering" }),
  meta("services-few-internal-links", { scope: "page", packIds: ["services.content"], category: "ux", severity: "low", scoreCategory: "ux", businessImpact: "low", weight: 0.65, tags: ["services"], title: "Few internal links" }),
  meta("services-no-proof", { scope: "page", packIds: ["services.trust"], category: "trust", severity: "medium", scoreCategory: "trust", businessImpact: "medium", weight: 0.85, tags: ["services"], title: "No service proof" }),
  meta("services-missing-benefits", { scope: "page", packIds: ["services.content"], category: "conversion", severity: "medium", scoreCategory: "conversion", businessImpact: "medium", weight: 0.8, tags: ["services"], title: "Missing benefits section" }),
  meta("services-shallow-explanation", { scope: "page", packIds: ["services.content"], category: "ux", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.82, tags: ["services"], title: "Shallow service explanation" }),

  // About
  meta("about-thin-story", { scope: "page", packIds: ["about.content"], category: "trust", severity: "medium", scoreCategory: "trust", businessImpact: "medium", weight: 0.8, tags: ["about"], title: "Thin about story" }),
  meta("about-missing-mission", { scope: "page", packIds: ["about.trust"], category: "trust", severity: "medium", scoreCategory: "trust", businessImpact: "medium", weight: 0.85, tags: ["about"], title: "Missing mission statement" }),
  meta("about-no-credibility", { scope: "page", packIds: ["about.trust"], category: "trust", severity: "medium", scoreCategory: "trust", businessImpact: "medium", weight: 0.82, tags: ["about"], title: "Low credibility signals" }),
  meta("about-missing-contact-path", { scope: "page", packIds: ["about.ux"], category: "conversion", severity: "medium", scoreCategory: "conversion", businessImpact: "medium", weight: 0.78, tags: ["about"], title: "Missing contact path" }),
  meta("about-missing-team", { scope: "page", packIds: ["about.trust"], category: "trust", severity: "low", scoreCategory: "trust", businessImpact: "low", weight: 0.65, tags: ["about"], title: "Missing team section" }),

  // Contact
  meta("contact-no-form", { scope: "page", packIds: ["contact.conversion"], category: "conversion", severity: "high", scoreCategory: "conversion", businessImpact: "high", weight: 1.05, tags: ["contact"], title: "No contact form" }),
  meta("contact-missing-email-path", { scope: "page", packIds: ["contact.conversion"], category: "conversion", severity: "medium", scoreCategory: "conversion", businessImpact: "medium", weight: 0.85, tags: ["contact"], title: "Missing email contact path" }),
  meta("contact-single-touchpoint", { scope: "page", packIds: ["contact.conversion"], category: "ux", severity: "low", scoreCategory: "ux", businessImpact: "low", weight: 0.6, tags: ["contact"], title: "Single contact touchpoint" }),
  meta("contact-missing-cta", { scope: "page", packIds: ["contact.conversion"], category: "conversion", severity: "medium", scoreCategory: "conversion", businessImpact: "medium", weight: 0.8, tags: ["contact"], title: "Missing contact CTA" }),
  meta("contact-thin-page", { scope: "page", packIds: ["contact.conversion"], category: "ux", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.75, tags: ["contact"], title: "Thin contact page" }),
  meta("contact-missing-business-info", { scope: "page", packIds: ["contact.technical"], category: "trust", severity: "medium", scoreCategory: "trust", businessImpact: "medium", weight: 0.78, tags: ["contact"], title: "Missing business information" }),

  // Projects
  meta("projects-thin-case-study", { scope: "page", packIds: ["projects.portfolio"], category: "ux", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.85, tags: ["projects"], title: "Thin case study" }),
  meta("projects-missing-outcomes", { scope: "page", packIds: ["projects.portfolio"], category: "conversion", severity: "high", scoreCategory: "conversion", businessImpact: "high", weight: 0.95, tags: ["projects"], title: "Missing project outcomes" }),
  meta("projects-missing-cta", { scope: "page", packIds: ["projects.conversion"], category: "conversion", severity: "medium", scoreCategory: "conversion", businessImpact: "medium", weight: 0.88, tags: ["projects"], title: "Missing project CTA" }),
  meta("projects-low-supporting-copy", { scope: "page", packIds: ["projects.portfolio"], category: "ux", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.8, tags: ["projects"], title: "Low supporting copy" }),
  meta("projects-missing-structure", { scope: "page", packIds: ["projects.portfolio"], category: "ux", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.78, tags: ["projects"], title: "Weak project structure" }),

  // Pricing
  meta("pricing-thin-page", { scope: "page", packIds: ["pricing.pricing"], category: "ux", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.82, tags: ["pricing"], title: "Thin pricing page" }),
  meta("pricing-missing-cta", { scope: "page", packIds: ["pricing.conversion"], category: "conversion", severity: "high", scoreCategory: "conversion", businessImpact: "high", weight: 1, tags: ["pricing"], title: "Missing pricing CTA" }),
  meta("pricing-unclear-plans", { scope: "page", packIds: ["pricing.pricing"], category: "ux", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.88, tags: ["pricing"], title: "Unclear pricing plans" }),
  meta("pricing-missing-trust", { scope: "page", packIds: ["pricing.trust"], category: "trust", severity: "medium", scoreCategory: "trust", businessImpact: "medium", weight: 0.8, tags: ["pricing"], title: "Missing pricing trust signals" }),

  // Blog
  meta("blog-thin-article", { scope: "page", packIds: ["blog.content"], category: "ux", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.8, tags: ["blog"], title: "Thin article content" }),
  meta("blog-missing-headings", { scope: "page", packIds: ["blog.seo"], category: "ux", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.75, tags: ["blog"], title: "Missing article headings" }),
  meta("blog-weak-title", { scope: "page", packIds: ["blog.seo"], category: "copy", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.72, tags: ["blog"], title: "Weak article title" }),
  meta("blog-low-readability", { scope: "page", packIds: ["blog.content"], category: "ux", severity: "low", scoreCategory: "ux", businessImpact: "low", weight: 0.6, tags: ["blog"], title: "Low content readability" }),

  // Legal
  meta("legal-thin-policy", { scope: "page", packIds: ["legal.compliance"], category: "trust", severity: "high", scoreCategory: "trust", businessImpact: "high", weight: 0.95, tags: ["legal"], title: "Thin legal policy" }),
  meta("legal-missing-headings", { scope: "page", packIds: ["legal.compliance"], category: "ux", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.78, tags: ["legal"], title: "Unstructured legal policy" }),
  meta("legal-missing-contact-reference", { scope: "page", packIds: ["legal.compliance"], category: "trust", severity: "medium", scoreCategory: "trust", businessImpact: "medium", weight: 0.8, tags: ["legal"], title: "Missing policy contact reference" }),

  // Features / signup / login
  meta("features-thin-page", { scope: "page", packIds: ["services.content"], category: "ux", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.8, tags: ["features"], title: "Thin features page" }),
  meta("features-missing-cta", { scope: "page", packIds: ["services.conversion"], category: "conversion", severity: "medium", scoreCategory: "conversion", businessImpact: "medium", weight: 0.85, tags: ["features"], title: "Missing features CTA" }),
  meta("signup-missing-form", { scope: "page", packIds: ["signup.conversion"], category: "conversion", severity: "high", scoreCategory: "conversion", businessImpact: "high", weight: 1, tags: ["signup"], title: "Missing signup form" }),
  meta("signup-thin-page", { scope: "page", packIds: ["signup.conversion"], category: "ux", severity: "low", scoreCategory: "ux", businessImpact: "low", weight: 0.55, tags: ["signup"], title: "Thin signup page" }),
  meta("login-missing-form", { scope: "page", packIds: ["login.conversion"], category: "conversion", severity: "high", scoreCategory: "conversion", businessImpact: "high", weight: 0.95, tags: ["login"], title: "Missing login form" }),

  // Site-wide
  meta("trust-missing-contact-page", { scope: "site", packIds: ["site.navigation-trust"], category: "trust", severity: "high", scoreCategory: "trust", businessImpact: "high", weight: 1.15, tags: ["site"], title: "Missing contact page" }),
  meta("trust-missing-privacy-policy", { scope: "site", packIds: ["site.navigation-trust"], category: "trust", severity: "high", scoreCategory: "trust", businessImpact: "high", weight: 1.1, tags: ["site"], title: "Missing privacy policy" }),
  meta("trust-missing-terms-page", { scope: "site", packIds: ["site.navigation-trust"], category: "trust", severity: "medium", scoreCategory: "trust", businessImpact: "medium", weight: 0.9, tags: ["site"], title: "Missing terms page" }),
  meta("site-footer-missing-legal", { scope: "site", packIds: ["site.navigation-trust"], category: "trust", severity: "medium", scoreCategory: "trust", businessImpact: "medium", weight: 0.85, tags: ["site"], title: "Footer missing legal links" }),
  meta("site-inconsistent-navigation", { scope: "site", packIds: ["site.navigation-trust"], category: "ux", severity: "low", scoreCategory: "ux", businessImpact: "low", weight: 0.65, tags: ["site"], title: "Inconsistent navigation" }),
  meta("site-weak-internal-linking", { scope: "site", packIds: ["site.navigation-trust"], category: "ux", severity: "medium", scoreCategory: "ux", businessImpact: "medium", weight: 0.75, tags: ["site"], title: "Weak internal linking" }),
  meta("site-missing-about-link", { scope: "site", packIds: ["site.navigation-trust"], category: "trust", severity: "medium", scoreCategory: "trust", businessImpact: "medium", weight: 0.78, tags: ["site"], title: "Missing about page" }),
  meta("site-missing-services-link", { scope: "site", packIds: ["site.navigation-trust"], category: "trust", severity: "medium", scoreCategory: "trust", businessImpact: "medium", weight: 0.78, tags: ["site"], title: "Missing services page" }),
]

const metadataById = new Map(RULE_METADATA.map((entry) => [entry.id, entry]))

export function getRuleMetadata(ruleId: string): RuleMetadata | undefined {
  return metadataById.get(ruleId)
}

export function inferConfidenceFromSeverity(severity: FindingSeverity): number {
  switch (severity) {
    case "critical":
      return 96
    case "high":
      return 88
    case "medium":
      return 76
    case "low":
      return 62
    default:
      return 70
  }
}
