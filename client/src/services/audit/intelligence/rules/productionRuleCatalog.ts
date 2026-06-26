import type { FindingSeverity } from "@/types/auditEngine"
import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import { toIntelligenceCategory } from "@/services/audit/intelligence/categories"
import type { BusinessImpactLevel } from "@/services/audit/intelligence/types"
import type { RuleAppliesTo, RuleScope } from "@/services/audit/intelligence/rules/ruleDefinition"

export type ProductionRuleCatalogEntry = {
  id: string
  scope: RuleScope
  appliesTo: RuleAppliesTo
  scoreCategory: ScoreCategory
  businessImpact: BusinessImpactLevel
  weight: number
  tags: string[]
}

/** Metadata for legacy production rules — drives multi-page execution and scoring weights */
export const PRODUCTION_RULE_CATALOG: ProductionRuleCatalogEntry[] = [
  {
    id: "hero-missing-primary-cta",
    scope: "page",
    appliesTo: ["homepage"],
    scoreCategory: "conversion",
    businessImpact: "high",
    weight: 1.1,
    tags: ["cta", "hero", "homepage"],
  },
  {
    id: "hero-multiple-competing-ctas",
    scope: "page",
    appliesTo: ["homepage"],
    scoreCategory: "ux",
    businessImpact: "medium",
    weight: 0.9,
    tags: ["cta", "hero", "homepage"],
  },
  {
    id: "hero-cta-below-fold",
    scope: "page",
    appliesTo: ["homepage"],
    scoreCategory: "conversion",
    businessImpact: "high",
    weight: 1,
    tags: ["cta", "hero", "homepage"],
  },
  {
    id: "hero-generic-headline",
    scope: "page",
    appliesTo: ["homepage"],
    scoreCategory: "ux",
    businessImpact: "medium",
    weight: 0.85,
    tags: ["copywriting", "hero", "homepage"],
  },
  {
    id: "hero-no-value-proposition",
    scope: "page",
    appliesTo: ["homepage"],
    scoreCategory: "ux",
    businessImpact: "high",
    weight: 1,
    tags: ["copywriting", "hero", "homepage"],
  },
  {
    id: "trust-missing-contact-page",
    scope: "site",
    appliesTo: "all",
    scoreCategory: "trust",
    businessImpact: "high",
    weight: 1.15,
    tags: ["trust", "navigation", "site-wide"],
  },
  {
    id: "trust-missing-privacy-policy",
    scope: "site",
    appliesTo: "all",
    scoreCategory: "trust",
    businessImpact: "high",
    weight: 1.1,
    tags: ["trust", "legal", "site-wide"],
  },
  {
    id: "trust-missing-terms-page",
    scope: "site",
    appliesTo: "all",
    scoreCategory: "trust",
    businessImpact: "medium",
    weight: 0.9,
    tags: ["trust", "legal", "site-wide"],
  },
  {
    id: "trust-no-testimonials",
    scope: "page",
    appliesTo: ["homepage"],
    scoreCategory: "trust",
    businessImpact: "medium",
    weight: 0.85,
    tags: ["trust", "social-proof", "homepage"],
  },
  {
    id: "trust-no-social-proof",
    scope: "page",
    appliesTo: ["homepage"],
    scoreCategory: "trust",
    businessImpact: "medium",
    weight: 0.85,
    tags: ["trust", "social-proof", "homepage"],
  },
  {
    id: "conversion-no-lead-capture",
    scope: "page",
    appliesTo: ["homepage"],
    scoreCategory: "conversion",
    businessImpact: "high",
    weight: 1.05,
    tags: ["forms", "conversion", "homepage"],
  },
  {
    id: "conversion-no-contact-form",
    scope: "page",
    appliesTo: ["contact"],
    scoreCategory: "conversion",
    businessImpact: "medium",
    weight: 1,
    tags: ["forms", "contact"],
  },
  {
    id: "conversion-weak-cta-language",
    scope: "page",
    appliesTo: ["homepage"],
    scoreCategory: "conversion",
    businessImpact: "medium",
    weight: 0.9,
    tags: ["cta", "copywriting", "homepage"],
  },
  {
    id: "conversion-too-many-nav-links",
    scope: "page",
    appliesTo: ["homepage"],
    scoreCategory: "ux",
    businessImpact: "medium",
    weight: 0.8,
    tags: ["navigation", "homepage"],
  },
  {
    id: "conversion-no-urgency",
    scope: "page",
    appliesTo: ["homepage"],
    scoreCategory: "conversion",
    businessImpact: "low",
    weight: 0.6,
    tags: ["conversion", "homepage"],
  },
  {
    id: "mobile-missing-viewport-meta",
    scope: "page",
    appliesTo: "all",
    scoreCategory: "mobile",
    businessImpact: "high",
    weight: 1,
    tags: ["mobile", "technical"],
  },
  {
    id: "mobile-small-touch-targets",
    scope: "page",
    appliesTo: "all",
    scoreCategory: "mobile",
    businessImpact: "medium",
    weight: 0.9,
    tags: ["mobile", "accessibility"],
  },
  {
    id: "mobile-horizontal-overflow",
    scope: "page",
    appliesTo: "all",
    scoreCategory: "mobile",
    businessImpact: "high",
    weight: 1,
    tags: ["mobile", "technical"],
  },
  {
    id: "mobile-small-font-sizes",
    scope: "page",
    appliesTo: "all",
    scoreCategory: "mobile",
    businessImpact: "medium",
    weight: 0.85,
    tags: ["mobile", "accessibility"],
  },
  {
    id: "mobile-oversized-images",
    scope: "page",
    appliesTo: "all",
    scoreCategory: "mobile",
    businessImpact: "medium",
    weight: 0.8,
    tags: ["mobile", "performance"],
  },
]

const catalogById = new Map(PRODUCTION_RULE_CATALOG.map((entry) => [entry.id, entry]))

export function getProductionRuleCatalogEntry(
  ruleId: string
): ProductionRuleCatalogEntry | undefined {
  return catalogById.get(ruleId)
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

export function mapLegacyCategoryToIntelligence(
  legacyCategory: import("@/types/auditEngine").FindingCategory
) {
  return toIntelligenceCategory(legacyCategory)
}
