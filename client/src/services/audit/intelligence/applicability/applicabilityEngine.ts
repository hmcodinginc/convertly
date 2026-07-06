/**
 * Intelligence V5 — Applicability Engine
 *
 * Single gate for rule execution:
 *
 *   Rule → Applicability Engine → applicable?
 *     YES → execute detector
 *     NO  → skip (no findings, recommendations, scoring, or ceilings)
 *
 * Declarations live in metadata:
 * - Website intent: websiteRuleApplicability.ts (pack defaults + per-rule overrides)
 * - Page intent: ruleApplicability.ts (page-type packs + overrides)
 *
 * Future rules only need metadata changes — detectors stay untouched.
 */

import { evaluateRuleApplicability } from "@/services/audit/intelligence/rules/ruleApplicability"
import {
  isRuleApplicableToWebsiteIntent,
  resolveWebsiteRuleApplicabilitySpec,
} from "@/services/audit/intelligence/websiteRuleApplicability"
import type {
  RuleApplicabilityContext,
  RuleExecutionApplicability,
} from "@/services/audit/intelligence/applicability/applicabilityTypes"

function rejectWebsiteIntent(
  websiteIntent: string,
  message?: string
): RuleExecutionApplicability {
  return {
    applicable: false,
    optional: false,
    reason: "not_applicable_website_intent",
    message:
      message ??
      `Rule not applicable to ${websiteIntent.replace(/_/g, " ")} websites`,
    rejectedBy: "website_intent",
  }
}

/**
 * Central execution gate. Call before any detector runs.
 */
export function evaluateRuleExecutionApplicability(
  ruleId: string,
  context: RuleApplicabilityContext
): RuleExecutionApplicability {
  if (!isRuleApplicableToWebsiteIntent(ruleId, context.websiteIntent)) {
    const spec = resolveWebsiteRuleApplicabilitySpec(ruleId)
    const excluded = spec.excludedIntents.includes(context.websiteIntent)
    return rejectWebsiteIntent(
      context.websiteIntent,
      excluded
        ? `Rule excluded for ${context.websiteIntent.replace(/_/g, " ")} websites`
        : `Rule not applicable to ${context.websiteIntent.replace(/_/g, " ")} websites`
    )
  }

  if (context.pageIntent == null) {
    return {
      applicable: true,
      optional: resolveWebsiteRuleApplicabilitySpec(ruleId).optional,
      reason: null,
      message: "Applicable",
      rejectedBy: null,
    }
  }

  const pageResult = evaluateRuleApplicability(ruleId, context.pageIntent)
  if (!pageResult.applicable) {
    return {
      applicable: false,
      optional: pageResult.optional,
      reason: pageResult.reason,
      message: pageResult.message,
      rejectedBy: "page_intent",
    }
  }

  return {
    applicable: true,
    optional: pageResult.optional,
    reason: null,
    message: pageResult.message,
    rejectedBy: null,
  }
}

/**
 * Filters rule ids to those executable for the given applicability context.
 */
export function filterApplicableRuleIds(
  ruleIds: string[],
  context: RuleApplicabilityContext
): string[] {
  return ruleIds.filter(
    (ruleId) => evaluateRuleExecutionApplicability(ruleId, context).applicable
  )
}
