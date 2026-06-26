import type { AuditPage, AuditPageType } from "@/types/auditEngine"

/** Logical page types for rule-pack assignment (extends DB page types without schema migration) */
export type RulePageType = AuditPageType | "projects" | "blog" | "legal"

const PATH_RULE_TYPE_OVERRIDES: Array<{ pattern: RegExp; rulePageType: RulePageType }> = [
  { pattern: /^\/(projects|portfolio|work|case-stud|case-studies)(\/|$)/i, rulePageType: "projects" },
  { pattern: /^\/(blog|news|articles|insights)(\/|$)/i, rulePageType: "blog" },
  { pattern: /^\/(privacy|terms|legal|cookies|cookie-policy|gdpr)(\/|$)/i, rulePageType: "legal" },
]

export function resolveRulePageType(page: AuditPage): RulePageType {
  const normalized = page.path.replace(/\/$/, "") || "/"

  for (const override of PATH_RULE_TYPE_OVERRIDES) {
    if (override.pattern.test(normalized)) {
      return override.rulePageType
    }
  }

  return page.pageType
}
