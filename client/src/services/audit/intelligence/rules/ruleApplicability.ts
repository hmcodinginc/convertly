import { getRuleMetadata, RULE_METADATA } from "@/services/audit/intelligence/rules/ruleMetadata"
import { resolveRuleScoringProfile } from "@/services/audit/intelligence/rules/ruleScoringMetadata"
import { getPageIntentProfile, PAGE_INTENT_PACKS } from "@/services/audit/intelligence/pageIntentProfiles"
import { intentToRulePageType } from "@/services/audit/intelligence/pageIntentProfiles"
import type { PageIntent } from "@/services/audit/intelligence/pageIntentTypes"
import type { RulePackId } from "@/services/audit/intelligence/rules/rulePacks"

export type RuleSkipReason =
  | "excluded_page_type"
  | "not_applicable_page_type"
  | "not_applicable_website_intent"
  | "pack_not_allowed_for_intent"
  | "pack_ignored_for_intent"
  | "missing_rule_metadata"
  | "page_analysis_gate_failed"
  | "site_rule_not_applicable"
  | "low_render_confidence"

export type RuleApplicabilityResult = {
  applicable: boolean
  optional: boolean
  reason: RuleSkipReason | null
  message: string
}

export type RuleApplicabilitySpec = {
  applicablePageTypes: PageIntent[] | "all"
  optionalPageTypes: PageIntent[]
  excludedPageTypes: PageIntent[]
}

/** Explicit per-rule overrides — sparse; defaults derived from pack membership */
export const RULE_APPLICABILITY_OVERRIDES: Partial<Record<string, Partial<RuleApplicabilitySpec>>> = {
  "hero-missing-primary-cta": {
    applicablePageTypes: ["homepage", "landing_page", "marketing"],
    excludedPageTypes: ["api_docs", "documentation", "legal", "login", "error_page", "search"],
  },
  "hero-no-value-proposition": {
    applicablePageTypes: ["homepage", "landing_page", "marketing"],
    excludedPageTypes: ["api_docs", "documentation", "legal", "error_page"],
  },
  "hero-cta-below-fold": {
    applicablePageTypes: ["homepage", "landing_page", "marketing"],
    excludedPageTypes: ["api_docs", "documentation", "legal"],
  },
  "hero-multiple-competing-ctas": {
    applicablePageTypes: ["homepage", "landing_page", "marketing", "pricing", "product"],
    excludedPageTypes: ["api_docs", "documentation", "legal", "login"],
  },
  "trust-no-testimonials": {
    applicablePageTypes: ["homepage", "landing_page", "marketing", "pricing", "product", "services"],
    excludedPageTypes: ["api_docs", "documentation", "legal", "login", "error_page", "search"],
  },
  "conversion-no-lead-capture": {
    applicablePageTypes: ["homepage", "landing_page", "marketing", "services", "product"],
    excludedPageTypes: ["api_docs", "documentation", "legal", "login", "error_page", "search", "changelog"],
  },
  "tech-thin-content": {
    optionalPageTypes: ["search", "error_page", "login", "signup"],
  },
}

const packToIntents = buildPackIntentIndex()

function buildPackIntentIndex(): Map<RulePackId, Set<PageIntent>> {
  const index = new Map<RulePackId, Set<PageIntent>>()
  for (const [intent, packs] of Object.entries(PAGE_INTENT_PACKS) as [PageIntent, RulePackId[]][]) {
    for (const packId of packs) {
      const set = index.get(packId) ?? new Set<PageIntent>()
      set.add(intent)
      index.set(packId, set)
    }
  }
  return index
}

export function resolveRuleApplicabilitySpec(ruleId: string): RuleApplicabilitySpec {
  const override = RULE_APPLICABILITY_OVERRIDES[ruleId]
  const meta = getRuleMetadata(ruleId)

  if (!meta) {
    return {
      applicablePageTypes: [],
      optionalPageTypes: [],
      excludedPageTypes: [],
    }
  }

  if (override?.applicablePageTypes) {
    return {
      applicablePageTypes: override.applicablePageTypes,
      optionalPageTypes: override.optionalPageTypes ?? [],
      excludedPageTypes: override.excludedPageTypes ?? [],
    }
  }

  const intents = new Set<PageIntent>()
  for (const packId of meta.packIds) {
    for (const intent of packToIntents.get(packId) ?? []) {
      intents.add(intent)
    }
  }

  return {
    applicablePageTypes: intents.size > 0 ? [...intents] : "all",
    optionalPageTypes: override?.optionalPageTypes ?? [],
    excludedPageTypes: override?.excludedPageTypes ?? [],
  }
}

/**
 * Determines whether a rule should run on a page intent.
 * Rules that are not applicable are SKIPPED (never failed).
 */
export function evaluateRuleApplicability(
  ruleId: string,
  intent: PageIntent
): RuleApplicabilityResult {
  const meta = getRuleMetadata(ruleId)
  if (!meta) {
    return {
      applicable: false,
      optional: false,
      reason: "missing_rule_metadata",
      message: "Rule metadata not found in catalog",
    }
  }

  const spec = resolveRuleApplicabilitySpec(ruleId)
  const intentProfile = getPageIntentProfile(intent)
  const allowedPacks = new Set(PAGE_INTENT_PACKS[intent])
  const ignoredPacks = new Set(intentProfile.ignoredRulePacks)

  if (spec.excludedPageTypes.includes(intent)) {
    return {
      applicable: false,
      optional: false,
      reason: "excluded_page_type",
      message: `Rule excluded for ${intent} pages`,
    }
  }

  const rulePacks = meta.packIds.filter(
    (packId) => allowedPacks.has(packId) && !ignoredPacks.has(packId)
  )
  if (rulePacks.length === 0) {
    const blockedByIgnore = meta.packIds.some((packId) => ignoredPacks.has(packId))
    return {
      applicable: false,
      optional: false,
      reason: blockedByIgnore ? "pack_ignored_for_intent" : "pack_not_allowed_for_intent",
      message: blockedByIgnore
        ? `Rule pack ignored for ${intent} pages`
        : `Rule packs [${meta.packIds.join(", ")}] not enabled for ${intent}`,
    }
  }

  if (spec.applicablePageTypes !== "all" && !spec.applicablePageTypes.includes(intent)) {
    const isOptional = spec.optionalPageTypes.includes(intent)
    if (!isOptional) {
      return {
        applicable: false,
        optional: false,
        reason: "not_applicable_page_type",
        message: `Rule not applicable to ${intent} pages`,
      }
    }
    return {
      applicable: true,
      optional: true,
      reason: null,
      message: `Optional rule for ${intent}`,
    }
  }

  const scoringProfile = resolveRuleScoringProfile(meta)
  if (scoringProfile.applicablePageTypes !== "all") {
    const rulePageType = intentToRulePageType(intent)
    if (!(scoringProfile.applicablePageTypes as readonly string[]).includes(rulePageType)) {
      return {
        applicable: false,
        optional: false,
        reason: "not_applicable_page_type",
        message: `Blocker scope limited to ${scoringProfile.applicablePageTypes.join(", ")}`,
      }
    }
  }

  return {
    applicable: true,
    optional: spec.optionalPageTypes.includes(intent),
    reason: null,
    message: "Applicable",
  }
}

export function getCatalogRuleIds(): string[] {
  return RULE_METADATA.map((rule) => rule.id)
}
