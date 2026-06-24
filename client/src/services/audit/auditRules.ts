import { productionAuditRules } from "@/services/audit/rules/productionRules"
import type { ScoredFindingInput } from "@/services/audit/scoring/calculateAuditScore"
import type { AuditRule, AuditRuleContext, AuditRuleResult } from "@/types/auditEngine"
import type { AuditScore } from "@/types/auditEngine"
import { SCORE_CATEGORY_DEFINITIONS } from "@/services/audit/constants"

const registeredRules: AuditRule[] = [...productionAuditRules]

let rulesBootstrapped = false

function ensureRulesRegistered(): void {
  if (rulesBootstrapped) return
  rulesBootstrapped = true
}

export function registerAuditRule(rule: AuditRule): void {
  registeredRules.push(rule)
}

export function getRegisteredAuditRules(): readonly AuditRule[] {
  ensureRulesRegistered()
  return registeredRules
}

export async function runAuditRules(context: AuditRuleContext): Promise<{
  findings: ScoredFindingInput[]
}> {
  ensureRulesRegistered()
  const findings: ScoredFindingInput[] = []

  for (const rule of registeredRules) {
    const result = await rule.run(context)
    findings.push(...(result.findings as ScoredFindingInput[]))
  }

  return { findings }
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
