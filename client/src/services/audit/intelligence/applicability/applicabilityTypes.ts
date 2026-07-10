import type { PageIntent } from "@/services/audit/intelligence/pageIntentTypes"
import type { WebsiteIntent } from "@/services/audit/intelligence/websiteIntentTypes"
import type { RuleSkipReason } from "@/services/audit/intelligence/rules/ruleApplicability"

/**
 * Intelligence V5 — execution-time applicability context.
 * Website intent is required; page intent is required for page-scoped rules.
 */
export type RuleApplicabilityContext = {
  websiteIntent: WebsiteIntent
  pageIntent?: PageIntent
}

export type ApplicabilityLayer = "website_intent" | "page_intent"

export type RuleExecutionApplicability = {
  applicable: boolean
  optional: boolean
  reason: RuleSkipReason | null
  message: string
  /** Which layer rejected the rule (null when applicable) */
  rejectedBy: ApplicabilityLayer | null
}
