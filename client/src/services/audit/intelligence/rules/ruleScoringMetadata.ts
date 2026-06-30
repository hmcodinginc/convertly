import type { AuditPageType } from "@/types/auditEngine"
import type { FindingSeverity } from "@/types/auditEngine"
import type { RuleMetadata } from "@/services/audit/intelligence/rules/ruleMetadata"
import {
  BLOCKER_TIER_DEFINITIONS,
  IMPACT_LEVEL_MULTIPLIER,
  type BlockerRuleOverride,
  type ImpactLevel,
  type RuleScoringProfile,
} from "@/services/audit/intelligence/scoring/scoringPolicy"

/**
 * Rule Metadata V2 — scoring extensions layered on RULE_METADATA.
 *
 * Keeps declarative rule catalog lean while centralizing scaling fields:
 * rule family, business profiles, page-type scope, blocker caps, impact level.
 */

const SEVERITY_TO_IMPACT: Record<FindingSeverity, ImpactLevel> = {
  critical: "blocker",
  high: "high",
  medium: "medium",
  low: "advisory",
}

/** Explicit blocker and foundation rule configuration */
export const BLOCKER_RULE_OVERRIDES: Record<string, BlockerRuleOverride> = {
  "tech-missing-viewport": {
    isBlocker: true,
    blockerTier: 0,
    isFoundation: true,
    impactLevel: "blocker",
  },
  "tech-horizontal-overflow": {
    isBlocker: true,
    blockerTier: 0,
    isFoundation: true,
    applicablePageTypes: ["homepage"],
  },
  "hero-missing-primary-cta": {
    isBlocker: true,
    blockerTier: 1,
    isFoundation: true,
    applicablePageTypes: ["homepage"],
  },
  "signup-missing-form": {
    isBlocker: true,
    blockerTier: 1,
    isFoundation: true,
    applicablePageTypes: ["signup"],
  },
  "login-missing-form": {
    isBlocker: true,
    blockerTier: 1,
    isFoundation: true,
    applicablePageTypes: ["login"],
  },
  "trust-missing-privacy-policy": {
    isBlocker: true,
    blockerTier: 2,
    isFoundation: true,
  },
  "trust-missing-contact-page": {
    isBlocker: true,
    blockerTier: 2,
    isFoundation: true,
  },
  "site-footer-missing-legal": {
    isBlocker: true,
    blockerTier: 3,
    isFoundation: true,
  },
  "tech-missing-page-title": {
    isBlocker: true,
    blockerTier: 3,
    applicablePageTypes: ["homepage"],
  },
}

const RULE_FAMILY_OVERRIDES: Record<string, string> = {
  "tech-thin-content": "thin-content",
  "services-thin-page": "thin-content",
  "features-thin-page": "thin-content",
  "contact-thin-page": "thin-content",
  "signup-thin-page": "thin-content",
  "about-thin-story": "thin-content",
  "projects-thin-case-study": "thin-content",
  "pricing-thin-page": "thin-content",
  "blog-thin-article": "thin-content",
  "legal-thin-policy": "thin-content",
  "services-missing-cta": "missing-cta",
  "features-missing-cta": "missing-cta",
  "contact-missing-cta": "missing-cta",
  "projects-missing-cta": "missing-cta",
  "pricing-missing-cta": "missing-cta",
}

const FOUNDATION_RULE_IDS = new Set(
  Object.entries(BLOCKER_RULE_OVERRIDES)
    .filter(([, config]) => config.isFoundation)
    .map(([id]) => id)
)

export function inferRuleFamily(ruleId: string): string {
  if (RULE_FAMILY_OVERRIDES[ruleId]) return RULE_FAMILY_OVERRIDES[ruleId]

  const segments = ruleId.split("-")
  if (segments.length >= 2) {
    return `${segments[0]}-${segments[1]}`
  }

  return segments[0] ?? ruleId
}

function resolveImpactLevel(meta: RuleMetadata): ImpactLevel {
  const override = BLOCKER_RULE_OVERRIDES[meta.id]
  if (override?.impactLevel) return override.impactLevel
  if (override?.isBlocker) return "blocker"
  return SEVERITY_TO_IMPACT[meta.severity]
}

function resolveBlockerConfig(meta: RuleMetadata): Pick<
  RuleScoringProfile,
  "isBlocker" | "blockerTier" | "capScore"
> {
  const override = BLOCKER_RULE_OVERRIDES[meta.id]
  if (!override?.isBlocker) {
    return { isBlocker: false, blockerTier: null, capScore: null }
  }

  const tier = override.blockerTier
  const capScore = override.capScore ?? BLOCKER_TIER_DEFINITIONS[tier].capScore

  return {
    isBlocker: true,
    blockerTier: tier,
    capScore,
  }
}

export function resolveRuleScoringProfile(meta: RuleMetadata): RuleScoringProfile {
  const impactLevel = resolveImpactLevel(meta)
  const blocker = resolveBlockerConfig(meta)
  const override = BLOCKER_RULE_OVERRIDES[meta.id]

  return {
    ruleFamily: inferRuleFamily(meta.id),
    businessProfiles: "all",
    applicablePageTypes: override?.applicablePageTypes ?? "all",
    isFoundation: override?.isFoundation ?? FOUNDATION_RULE_IDS.has(meta.id),
    impactLevel,
    influenceMultiplier: IMPACT_LEVEL_MULTIPLIER[impactLevel],
    ...blocker,
  }
}

export function getRuleScoringProfile(ruleId: string, meta?: RuleMetadata | null): RuleScoringProfile | null {
  if (!meta) return null
  return resolveRuleScoringProfile(meta)
}

export function isBlockerApplicableToPage(
  profile: RuleScoringProfile,
  pageType: AuditPageType
): boolean {
  if (!profile.isBlocker) return false
  if (profile.applicablePageTypes === "all") return true
  return profile.applicablePageTypes.includes(pageType)
}

export type RuleMetadataV2 = RuleMetadata & RuleScoringProfile

export function enrichRuleMetadata(meta: RuleMetadata): RuleMetadataV2 {
  return { ...meta, ...resolveRuleScoringProfile(meta) }
}
