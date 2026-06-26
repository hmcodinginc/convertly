import {
  buildFindingDescription,
  resolveRuleConfidence,
} from "@/services/audit/intelligence/rules/buildProductionRules"
import { getRuleMetadata } from "@/services/audit/intelligence/rules/ruleMetadata"
import { getRuleRegistry } from "@/services/audit/intelligence/rules/ruleRegistry"
import {
  getRuleIdsForPageType,
  getSiteRuleIds,
} from "@/services/audit/intelligence/rules/rulePacks"
import { resolveRulePageType } from "@/services/audit/intelligence/rules/rulePageType"
import type { AuditPage } from "@/types/auditEngine"
import type { PageRuleContext, SiteRuleContext } from "@/services/audit/intelligence/types"
import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"
import type { ScoredFindingInput } from "@/services/audit/scoring/calculateAuditScore"
import type { RuleDefinition } from "@/services/audit/intelligence/rules/ruleDefinition"

function draftFromRule(
  rule: RuleDefinition,
  context: PageRuleContext | SiteRuleContext,
  pageId?: string
): IntelligenceFindingDraft {
  return {
    ruleId: rule.id,
    pageId,
    category: rule.category,
    legacyCategory: getRuleMetadata(rule.id)?.category ?? "ux",
    severity: rule.severity,
    scoreCategory: rule.scoreCategory,
    title: rule.title,
    description: rule.description,
    recommendation: rule.recommendation(context),
    confidence: resolveRuleConfidence(rule.id),
    businessImpact: rule.businessImpact,
    weight: rule.weight,
    scope: rule.scope,
    evidence: [],
    tags: rule.tags,
  }
}

async function evaluateRule(
  rule: RuleDefinition,
  context: PageRuleContext | SiteRuleContext,
  pageId?: string
): Promise<IntelligenceFindingDraft[]> {
  const result = await rule.detector(context)
  if (!result.triggered) return []

  const meta = getRuleMetadata(rule.id)
  const finding = draftFromRule(rule, context, pageId)
  finding.description = buildFindingDescription(rule.id, context, result.evidence ?? [])
  finding.recommendation = rule.recommendation(context)
  finding.confidence = resolveRuleConfidence(rule.id, result.confidence)
  finding.evidence = result.evidence ?? []
  finding.severity = meta?.severity ?? rule.severity

  return [finding]
}

export async function executePageRules(
  context: PageRuleContext
): Promise<IntelligenceFindingDraft[]> {
  const registry = getRuleRegistry()
  const rulePageType = resolveRulePageType(context.currentSnapshot.page)
  const ruleIds = getRuleIdsForPageType(rulePageType)
  const rules = registry.getByIds(ruleIds).filter((rule) => rule.scope === "page")
  const findings: IntelligenceFindingDraft[] = []

  for (const rule of rules) {
    const ruleFindings = await evaluateRule(rule, context, context.currentSnapshot.page.id)
    findings.push(...ruleFindings)
  }

  return findings
}

export async function executeSiteRules(
  context: SiteRuleContext
): Promise<IntelligenceFindingDraft[]> {
  const registry = getRuleRegistry()
  const ruleIds = getSiteRuleIds()
  const rules = registry.getByIds(ruleIds).filter((rule) => rule.scope === "site")
  const findings: IntelligenceFindingDraft[] = []

  for (const rule of rules) {
    const ruleFindings = await evaluateRule(rule, context)
    findings.push(...ruleFindings)
  }

  return findings
}

export function toScoredFindingInputs(
  findings: IntelligenceFindingDraft[]
): ScoredFindingInput[] {
  return findings.map((finding) => ({
    ruleId: finding.ruleId,
    scoreCategory: finding.scoreCategory,
    severity: finding.severity,
    category: finding.legacyCategory,
    title: finding.title,
    description: finding.description,
    recommendation: finding.recommendation,
    pageId: finding.pageId,
  }))
}

export function dedupeFindings(
  findings: IntelligenceFindingDraft[]
): IntelligenceFindingDraft[] {
  const seen = new Set<string>()
  const deduped: IntelligenceFindingDraft[] = []

  for (const finding of findings) {
    const key = `${finding.ruleId}:${finding.pageId ?? "site"}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(finding)
  }

  return deduped
}

export function countRulesForPage(page: AuditPage): number {
  return getRuleIdsForPageType(resolveRulePageType(page)).length
}

export function getCatalogEntry(ruleId: string) {
  return getRuleMetadata(ruleId)
}
