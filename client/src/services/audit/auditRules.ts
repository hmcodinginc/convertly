import { productionAuditRules } from "@/services/audit/rules/productionRules"
import {
  bootstrapIntelligenceEngine,
  runIntelligenceEngine,
} from "@/services/audit/intelligence"
import { getRuleRegistry } from "@/services/audit/intelligence/rules/ruleRegistry"
import type { ScoreCategory, ScoredFindingInput } from "@/services/audit/scoring/calculateAuditScore"
import type { AuditRule, AuditRuleContext, AuditRuleResult } from "@/types/auditEngine"
import type { AuditScore } from "@/types/auditEngine"
import { SCORE_CATEGORY_DEFINITIONS } from "@/services/audit/constants"

const legacyRulesById = new Map(productionAuditRules.map((rule) => [rule.id, rule]))

export function registerAuditRule(rule: AuditRule): void {
  bootstrapIntelligenceEngine()

  if (legacyRulesById.has(rule.id) || getRuleRegistry().getById(rule.id)) {
    throw new Error(`Rule already registered: ${rule.id}`)
  }

  legacyRulesById.set(rule.id, rule)
}

export function getRegisteredAuditRules(): readonly AuditRule[] {
  return [...productionAuditRules, ...legacyRulesById.values()].filter(
    (rule, index, rules) => rules.findIndex((item) => item.id === rule.id) === index
  )
}

export async function runAuditRules(
  context: AuditRuleContext,
  options?: {
    onPageAnalyzed?: Parameters<typeof runIntelligenceEngine>[1]["onPageAnalyzed"]
  }
): Promise<{
  findings: ScoredFindingInput[]
  categories: Record<ScoreCategory, number>
  growthScore: number
  pageScores: Record<string, number>
}> {
  bootstrapIntelligenceEngine()

  const result = await runIntelligenceEngine(context, {
    onPageAnalyzed: options?.onPageAnalyzed,
  })

  return {
    findings: result.scoredFindings,
    categories: result.categories,
    growthScore: result.growthScore,
    pageScores: result.pageScores,
  }
}

export function createScorePlaceholders(auditId: string): AuditScore[] {
  const now = new Date().toISOString()

  return SCORE_CATEGORY_DEFINITIONS.map((definition) => ({
    id: crypto.randomUUID(),
    auditId,
    category: definition.category,
    score: null,
    maxScore: definition.maxScore,
    label: definition.label,
    createdAt: now,
    updatedAt: now,
  }))
}

export type { AuditRuleResult }
