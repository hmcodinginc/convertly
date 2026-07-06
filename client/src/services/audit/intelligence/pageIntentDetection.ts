import type { PageContentSnapshot } from "@/services/audit/pageContentService"
import type { AuditPage } from "@/types/auditEngine"
import { getSnapshotMetrics } from "@/services/audit/rules/snapshotMetrics"
import {
  getPageIntentProfile,
  PAGE_INTENT_PACKS,
} from "@/services/audit/intelligence/pageIntentProfiles"
import type { DetectedPageIntent, PageIntent } from "@/services/audit/intelligence/pageIntentTypes"
import { getPackRuleIds } from "@/services/audit/intelligence/rules/rulePacks"
import { evaluateRuleApplicability } from "@/services/audit/intelligence/rules/ruleApplicability"

export type PageIntentContext = {
  page: AuditPage
  snapshot?: PageContentSnapshot
}

type IntentSignal = {
  intent: PageIntent
  weight: number
  signal: string
}

function normalizePath(path: string): string {
  const trimmed = path.replace(/\/+$/, "") || "/"
  return trimmed.startsWith("/") ? trimmed.toLowerCase() : `/${trimmed.toLowerCase()}`
}

function extractSignals(context: PageIntentContext): IntentSignal[] {
  const path = normalizePath(context.page.path)
  const title = context.page.title.toLowerCase()
  const document = context.snapshot?.document
  const html = (context.snapshot?.html ?? "").slice(0, 12_000).toLowerCase()
  const metrics = context.snapshot?.document ? getSnapshotMetrics(context.snapshot) : null

  const metaDescription =
    document?.querySelector('meta[name="description" i]')?.getAttribute("content")?.toLowerCase() ??
    ""
  const h1 = metrics?.firstH1?.toLowerCase() ?? ""
  const navLabels = Array.from(document?.querySelectorAll("nav a, header a") ?? [])
    .map((anchor) => anchor.textContent?.trim().toLowerCase() ?? "")
    .filter(Boolean)
    .join(" ")

  const hasSchema = /application\/ld\+json/i.test(html)
  const schemaTypes = [...html.matchAll(/"@type"\s*:\s*"([^"]+)"/gi)].map((m) => m[1]?.toLowerCase())

  const signals: IntentSignal[] = []

  const pathRules: Array<{ pattern: RegExp; intent: PageIntent; signal: string; weight: number }> = [
    { pattern: /^\/$|^\/home$/i, intent: "homepage", signal: "path:homepage", weight: 40 },
    { pattern: /^\/(pricing|plans|price)(\/|$)/i, intent: "pricing", signal: "path:pricing", weight: 40 },
    { pattern: /^\/(blog|news|insights)(\/|$)/i, intent: "blog", signal: "path:blog-index", weight: 35 },
    { pattern: /^\/(blog|news|articles|posts)\/.+/i, intent: "article", signal: "path:article", weight: 38 },
    { pattern: /^\/(docs|documentation|developers)(\/|$)/i, intent: "documentation", signal: "path:docs-root", weight: 38 },
    { pattern: /^\/(docs|documentation|developers)\/.+/i, intent: "documentation", signal: "path:docs-page", weight: 35 },
    { pattern: /^\/(kb|knowledge|knowledge-base|help-center)(\/|$)/i, intent: "knowledge_base", signal: "path:kb", weight: 38 },
    { pattern: /^\/(api|graphql|rest|reference)(\/|$)/i, intent: "api_docs", signal: "path:api", weight: 40 },
    { pattern: /^\/(changelog|releases|release-notes)(\/|$)/i, intent: "changelog", signal: "path:changelog", weight: 38 },
    { pattern: /^\/(login|sign-in|signin|auth)(\/|$)/i, intent: "login", signal: "path:login", weight: 40 },
    { pattern: /^\/(signup|sign-up|register|join)(\/|$)/i, intent: "signup", signal: "path:signup", weight: 40 },
    { pattern: /^\/(dashboard|app|console)(\/|$)/i, intent: "dashboard", signal: "path:dashboard", weight: 38 },
    { pattern: /^\/(account|settings|profile)(\/|$)/i, intent: "account_settings", signal: "path:account", weight: 36 },
    { pattern: /^\/(contact|contact-us)(\/|$)/i, intent: "contact", signal: "path:contact", weight: 38 },
    { pattern: /^\/(about|about-us|company)(\/|$)/i, intent: "about", signal: "path:about", weight: 38 },
    { pattern: /^\/(careers|jobs|join-us)(\/|$)/i, intent: "careers", signal: "path:careers", weight: 38 },
    { pattern: /^\/(support|help)(\/|$)/i, intent: "support", signal: "path:support", weight: 36 },
    { pattern: /^\/(faq|faqs)(\/|$)/i, intent: "faq", signal: "path:faq", weight: 38 },
    { pattern: /^\/(privacy|terms|legal|cookies|gdpr)(\/|$)/i, intent: "legal", signal: "path:legal", weight: 40 },
    { pattern: /^\/(checkout|cart|basket)(\/|$)/i, intent: "checkout", signal: "path:checkout", weight: 40 },
    { pattern: /^\/(search|find)(\/|$)/i, intent: "search", signal: "path:search", weight: 36 },
    { pattern: /^\/(404|500|error)(\/|$)/i, intent: "error_page", signal: "path:error", weight: 40 },
    { pattern: /^\/(landing|lp|campaign)(\/|$)/i, intent: "landing_page", signal: "path:landing", weight: 38 },
    { pattern: /^\/(product|products|platform)(\/|$)/i, intent: "product", signal: "path:product", weight: 36 },
    { pattern: /^\/(features|feature)(\/|$)/i, intent: "features", signal: "path:features", weight: 36 },
    { pattern: /^\/(services|solutions)(\/|$)/i, intent: "services", signal: "path:services", weight: 36 },
    { pattern: /^\/(projects|portfolio|work|case-stud)/i, intent: "portfolio", signal: "path:portfolio", weight: 36 },
    { pattern: /^\/domains(\/|$)/i, intent: "product", signal: "path:domains", weight: 34 },
  ]

  for (const rule of pathRules) {
    if (rule.pattern.test(path)) {
      signals.push({ intent: rule.intent, weight: rule.weight, signal: rule.signal })
    }
  }

  const keywordRules: Array<{ pattern: RegExp; intent: PageIntent; signal: string; weight: number }> = [
    { pattern: /\b(pricing|plans|per month)\b/i, intent: "pricing", signal: "keyword:pricing", weight: 12 },
    { pattern: /\b(api reference|graphql|rest api|endpoint)\b/i, intent: "api_docs", signal: "keyword:api", weight: 14 },
    { pattern: /\b(documentation|developer docs|getting started)\b/i, intent: "documentation", signal: "keyword:docs", weight: 12 },
    { pattern: /\b(knowledge base|help center)\b/i, intent: "knowledge_base", signal: "keyword:kb", weight: 12 },
    { pattern: /\b(changelog|release notes|what's new)\b/i, intent: "changelog", signal: "keyword:changelog", weight: 12 },
    { pattern: /\b(sign in|log in|login)\b/i, intent: "login", signal: "keyword:login", weight: 10 },
    { pattern: /\b(sign up|get started free|create account)\b/i, intent: "signup", signal: "keyword:signup", weight: 10 },
    { pattern: /\b(frequently asked|faq)\b/i, intent: "faq", signal: "keyword:faq", weight: 12 },
    { pattern: /\b(page not found|404|something went wrong)\b/i, intent: "error_page", signal: "keyword:error", weight: 14 },
    { pattern: /\b(checkout|payment|billing)\b/i, intent: "checkout", signal: "keyword:checkout", weight: 12 },
    { pattern: /\b(domain|dns|registrar)\b/i, intent: "product", signal: "keyword:domains", weight: 10 },
  ]

  const textBlob = `${title} ${metaDescription} ${h1} ${navLabels} ${html.slice(0, 2000)}`
  for (const rule of keywordRules) {
    if (rule.pattern.test(textBlob)) {
      signals.push({ intent: rule.intent, weight: rule.weight, signal: rule.signal })
    }
  }

  if (schemaTypes.includes("article") || schemaTypes.includes("blogposting")) {
    signals.push({ intent: "article", weight: 16, signal: "schema:article" })
  }
  if (schemaTypes.includes("product")) {
    signals.push({ intent: "product", weight: 14, signal: "schema:product" })
  }
  if (schemaTypes.includes("faqpage")) {
    signals.push({ intent: "faq", weight: 16, signal: "schema:faq" })
  }
  if (hasSchema && schemaTypes.includes("webpage") && path === "/") {
    signals.push({ intent: "homepage", weight: 8, signal: "schema:webpage-root" })
  }

  if (context.page.pageType !== "custom") {
    const dbIntent = context.page.pageType as PageIntent
    if (dbIntent in PAGE_INTENT_PACKS) {
      signals.push({ intent: dbIntent, weight: 18, signal: `db:${dbIntent}` })
    }
  }

  return signals
}

/**
 * Detects page intent from URL, metadata, headings, navigation, schema, and content keywords.
 * Fully deterministic — highest weighted signal wins; ties broken by intent priority order.
 */
export function detectPageIntent(context: PageIntentContext): DetectedPageIntent {
  const signals = extractSignals(context)
  const scores = new Map<PageIntent, { score: number; matched: string[] }>()

  for (const signal of signals) {
    const existing = scores.get(signal.intent) ?? { score: 0, matched: [] }
    existing.score += signal.weight
    existing.matched.push(signal.signal)
    scores.set(signal.intent, existing)
  }

  let bestIntent: PageIntent = "generic"
  let bestScore = 0
  let matchedSignals: string[] = []

  for (const [intent, data] of scores) {
    if (data.score > bestScore) {
      bestIntent = intent
      bestScore = data.score
      matchedSignals = data.matched
    }
  }

  const detectionConfidence = Math.min(98, Math.max(42, bestScore))

  return {
    pageIntent: bestIntent,
    profile: getPageIntentProfile(bestIntent),
    detectionConfidence,
    matchedSignals,
  }
}

export function getRuleIdsForIntent(intent: PageIntent): string[] {
  const packIds = PAGE_INTENT_PACKS[intent] ?? PAGE_INTENT_PACKS.generic
  const profile = getPageIntentProfile(intent)
  const ignored = new Set(profile.ignoredRulePacks)
  const ids = new Set<string>()

  for (const packId of packIds) {
    if (ignored.has(packId)) continue
    for (const ruleId of getPackRuleIds(packId)) {
      const applicability = evaluateRuleApplicability(ruleId, intent)
      if (applicability.applicable) {
        ids.add(ruleId)
      }
    }
  }

  return [...ids].sort()
}

export function isRuleApplicableToIntent(ruleId: string, intent: PageIntent): boolean {
  return evaluateRuleApplicability(ruleId, intent).applicable
}

export { intentToRulePageType, PAGE_INTENT_PACKS, getPageIntentProfile } from "@/services/audit/intelligence/pageIntentProfiles"
