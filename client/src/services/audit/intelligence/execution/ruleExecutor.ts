import { productionAuditRules } from "@/services/audit/rules/productionRules"
import { getProductionRuleCatalogEntry } from "@/services/audit/intelligence/rules/productionRuleCatalog"
import {
  enrichScoredFinding,
  runLegacyRule,
} from "@/services/audit/intelligence/rules/legacyRuleAdapter"
import { getRuleRegistry } from "@/services/audit/intelligence/rules/ruleRegistry"
import { ruleAppliesToPage } from "@/services/audit/intelligence/rules/ruleDefinition"
import type { PageRuleContext, SiteRuleContext } from "@/services/audit/intelligence/types"
import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"
import type { AuditRuleContext } from "@/types/auditEngine"
import type { ScoredFindingInput } from "@/services/audit/scoring/calculateAuditScore"
import {
  beginPageRuleTrace,
  endPageRuleTrace,
  isPageRuleTraceEnabled,
  logPageRuleEvaluation,
  logPageRuleNotApplicable,
} from "@/services/audit/debug/pageRuleEvaluationTrace"

const legacyRuleById = new Map(productionAuditRules.map((rule) => [rule.id, rule]))

function toAuditContext(
  context: PageRuleContext | SiteRuleContext,
  currentSnapshot?: PageRuleContext["currentSnapshot"]
): AuditRuleContext {
  return {
    session: context.session,
    pages: context.pages,
    pageSnapshots: context.pageSnapshots,
    currentPageSnapshot: currentSnapshot,
  }
}

async function runPageRule(
  context: PageRuleContext,
  ruleId: string
): Promise<IntelligenceFindingDraft[]> {
  const legacyRule = legacyRuleById.get(ruleId)
  if (!legacyRule) return []

  const scored = await runLegacyRule(legacyRule, toAuditContext(context, context.currentSnapshot))
  const findings: IntelligenceFindingDraft[] = []

  for (const finding of scored) {
    if (!finding.pageId) {
      finding.pageId = context.currentSnapshot.page.id
    }
    findings.push(enrichScoredFinding(finding, "page"))
  }

  return findings
}

export async function executePageRules(
  context: PageRuleContext
): Promise<IntelligenceFindingDraft[]> {
  const registry = getRuleRegistry()
  const pageType = context.currentSnapshot.page.pageType
  const findings: IntelligenceFindingDraft[] = []

  if (!isPageRuleTraceEnabled()) {
    const rules = registry.getPageRules(pageType)

    for (const ruleDef of rules) {
      const ruleFindings = await runPageRule(context, ruleDef.id)
      findings.push(...ruleFindings)
    }

    return findings
  }

  const pageStats = beginPageRuleTrace(context.currentSnapshot.page.path)
  const allPageRules = registry
    .getAll()
    .filter((rule) => rule.scope === "page" && rule.enabled)
    .sort((a, b) => a.id.localeCompare(b.id))

  for (const ruleDef of allPageRules) {
    if (!ruleAppliesToPage(ruleDef, pageType)) {
      logPageRuleNotApplicable(ruleDef.id, pageStats)
      continue
    }

    const legacyRule = legacyRuleById.get(ruleDef.id)
    if (!legacyRule) {
      logPageRuleNotApplicable(ruleDef.id, pageStats)
      continue
    }

    const ruleFindings = await runPageRule(context, ruleDef.id)
    findings.push(...ruleFindings)
    logPageRuleEvaluation(ruleDef.id, ruleFindings.length, pageStats)
  }

  endPageRuleTrace(pageStats)
  return findings
}

export async function executeSiteRules(
  context: SiteRuleContext
): Promise<IntelligenceFindingDraft[]> {
  const registry = getRuleRegistry()
  const rules = registry.getSiteRules()
  const findings: IntelligenceFindingDraft[] = []

  for (const ruleDef of rules) {
    const legacyRule = legacyRuleById.get(ruleDef.id)
    if (!legacyRule) continue

    const scored = await runLegacyRule(legacyRule, toAuditContext(context))
    for (const finding of scored) {
      findings.push(enrichScoredFinding(finding, "site"))
    }
  }

  return findings
}

export function getApplicableLegacyRuleIds(pageType: string): string[] {
  const registry = getRuleRegistry()
  return registry
    .getPageRules(pageType as PageRuleContext["currentSnapshot"]["page"]["pageType"])
    .map((rule) => rule.id)
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

export function countRulesForPage(pageType: PageRuleContext["currentSnapshot"]["page"]["pageType"]): number {
  return getRuleRegistry().getPageRules(pageType).length
}

export function getCatalogEntry(ruleId: string) {
  return getProductionRuleCatalogEntry(ruleId)
}
