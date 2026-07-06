import type { PageContentSnapshot } from "@/services/audit/pageContentService"
import { getSnapshotMetrics } from "@/services/audit/rules/snapshotMetrics"
import type { AuditPage, AuditSession } from "@/types/auditEngine"
import type {
  DetectedWebsiteIntent,
  WebsiteIntent,
} from "@/services/audit/intelligence/websiteIntentTypes"

type IntentSignal = {
  intent: WebsiteIntent
  weight: number
  signal: string
}

type DomainIntentHint = {
  pattern: RegExp
  intent: WebsiteIntent
  signal: string
}

/**
 * Domain hints take precedence over content heuristics.
 * Marketplace (Amazon) must never be overridden by cart/checkout content signals → ecommerce.
 */
const DOMAIN_INTENT_HINTS: DomainIntentHint[] = [
  { pattern: /(^|\.)google\.[a-z.]+$/i, intent: "search_engine", signal: "domain:google" },
  { pattern: /(^|\.)bing\.com$/i, intent: "search_engine", signal: "domain:bing" },
  { pattern: /(^|\.)duckduckgo\.com$/i, intent: "search_engine", signal: "domain:ddg" },
  { pattern: /(^|\.)github\.com$/i, intent: "open_source", signal: "domain:github" },
  { pattern: /(^|\.)gitlab\.com$/i, intent: "open_source", signal: "domain:gitlab" },
  { pattern: /(^|\.)vercel\.com$/i, intent: "developer_platform", signal: "domain:vercel" },
  { pattern: /(^|\.)supabase\.com$/i, intent: "developer_platform", signal: "domain:supabase" },
  { pattern: /(^|\.)netlify\.com$/i, intent: "developer_platform", signal: "domain:netlify" },
  { pattern: /(^|\.)stripe\.com$/i, intent: "developer_platform", signal: "domain:stripe" },
  { pattern: /(^|\.)shopify\.com$/i, intent: "ecommerce", signal: "domain:shopify" },
  { pattern: /(^|\.)amazon\.[a-z.]+$/i, intent: "marketplace", signal: "domain:amazon" },
  { pattern: /(^|\.)etsy\.com$/i, intent: "marketplace", signal: "domain:etsy" },
  { pattern: /(^|\.)medium\.com$/i, intent: "blog", signal: "domain:medium" },
  { pattern: /(^|\.)substack\.com$/i, intent: "blog", signal: "domain:substack" },
  { pattern: /(^|\.)hmcoding\.com$/i, intent: "agency", signal: "domain:hmcoding" },
  { pattern: /convertly/i, intent: "saas", signal: "domain:convertly" },
]

const DOMAIN_LOCK_CONFIDENCE = 94

function extractHostname(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.toLowerCase()
  } catch {
    return url.toLowerCase()
  }
}

function resolveDomainLockedIntent(hostname: string): DetectedWebsiteIntent | null {
  for (const hint of DOMAIN_INTENT_HINTS) {
    if (hint.pattern.test(hostname)) {
      return {
        websiteIntent: hint.intent,
        confidence: DOMAIN_LOCK_CONFIDENCE,
        signals: [hint.signal, "domain-lock:active"],
      }
    }
  }
  return null
}

function homepageSnapshot(
  pages: AuditPage[],
  snapshots: PageContentSnapshot[]
): PageContentSnapshot | undefined {
  const homepage =
    pages.find((page) => page.pageType === "homepage") ??
    pages.find((page) => page.path === "/" || page.path === "") ??
    pages[0]

  if (!homepage) return undefined
  return snapshots.find((snapshot) => snapshot.page.id === homepage.id)
}

function collectContentSignals(input: {
  session: AuditSession
  pages: AuditPage[]
  pageSnapshots: PageContentSnapshot[]
}): IntentSignal[] {
  const signals: IntentSignal[] = []
  const homepage = homepageSnapshot(input.pages, input.pageSnapshots)
  const html = (homepage?.html ?? "").slice(0, 24_000).toLowerCase()
  const document = homepage?.document
  const metrics = homepage?.document ? getSnapshotMetrics(homepage) : null

  const navLabels = Array.from(document?.querySelectorAll("nav a, header a") ?? [])
    .map((anchor) => anchor.textContent?.trim().toLowerCase() ?? "")
    .filter(Boolean)

  const navText = navLabels.join(" ")
  const pagePaths = input.pages.map((page) => page.path.toLowerCase()).join(" ")
  const pageTypes = input.pages.map((page) => page.pageType).join(" ")

  const hasSearchInput =
    Boolean(document?.querySelector('input[type="search"], input[name*="search" i], input[aria-label*="search" i]')) ||
    /role=["']search["']/i.test(html)

  const hasCart = /cart|checkout|basket|add to cart/i.test(navText + html)
  const hasPricing = /pricing|plans|subscribe/i.test(navText + pagePaths)
  const hasDocs = /docs|documentation|developers|api reference|getting started/i.test(navText + pagePaths)
  const hasBlog = input.pages.some((page) => /\/(blog|news|articles)(\/|$)/i.test(page.path))
  const hasServices = input.pages.some((page) => page.pageType === "services")
  const hasPortfolio = input.pages.some((page) => /\/(projects|portfolio|work)(\/|$)/i.test(page.path))
  const hasSignup = input.pages.some((page) => page.pageType === "signup")
  const hasLogin = input.pages.some((page) => page.pageType === "login")

  if (hasSearchInput && metrics && metrics.formCount <= 2 && metrics.buttonCount <= 3) {
    signals.push({ intent: "search_engine", weight: 28, signal: "homepage:search-dominant" })
  }

  if (hasDocs || /\/(docs|api|developers)\b/i.test(pagePaths)) {
    signals.push({ intent: "documentation", weight: 22, signal: "site:documentation-pages" })
    signals.push({ intent: "developer_platform", weight: 18, signal: "site:developer-content" })
  }

  if (/deploy|developer|sdk|cli|repository|open source|api/i.test(html + navText)) {
    signals.push({ intent: "developer_platform", weight: 20, signal: "content:developer-language" })
  }

  if (hasCart && !/marketplace|sellers|vendors|third.party sellers/i.test(html + navText)) {
    signals.push({ intent: "ecommerce", weight: 24, signal: "site:merchant-commerce" })
  }

  if (hasPricing && (hasSignup || /free trial|get started|start building/i.test(html))) {
    signals.push({ intent: "saas", weight: 22, signal: "site:saas-funnel" })
  }

  if (hasServices && (hasPortfolio || /our services|case stud|clients we/i.test(html))) {
    signals.push({ intent: "agency", weight: 24, signal: "site:agency-signals" })
  }

  if (hasBlog && !hasPricing && !hasSignup) {
    signals.push({ intent: "blog", weight: 18, signal: "site:blog-focused" })
  }

  if (/community|forum|discussions|members/i.test(navText + html)) {
    signals.push({ intent: "community", weight: 20, signal: "site:community-signals" })
  }

  if (/marketplace|vendors|sellers|listings|third.party seller/i.test(html + navText)) {
    signals.push({ intent: "marketplace", weight: 22, signal: "site:marketplace-signals" })
  }

  if (hasLogin && hasSignup && !hasCart) {
    signals.push({ intent: "dashboard", weight: 16, signal: "site:app-auth-shell" })
  }

  if (/\/(dashboard|console|app)(\/|$)/i.test(pagePaths)) {
    signals.push({ intent: "dashboard", weight: 22, signal: "path:dashboard" })
  }

  if (/open source|mit license|apache license|contributors welcome/i.test(html)) {
    signals.push({ intent: "open_source", weight: 18, signal: "content:open-source" })
  }

  if (hasPortfolio || /case stud|our work|portfolio/i.test(navText + html)) {
    signals.push({ intent: "portfolio", weight: 20, signal: "site:portfolio" })
  }

  if (hasPricing && /landing|marketing|campaign/i.test(navText + pagePaths)) {
    signals.push({ intent: "marketing", weight: 18, signal: "site:marketing-funnel" })
  }

  if (hasCart || (hasPricing && /shop|store|buy/i.test(html))) {
    signals.push({ intent: "commerce", weight: 20, signal: "site:commerce" })
  }

  if (hasLogin && hasSignup && hasPricing) {
    signals.push({ intent: "saas", weight: 16, signal: "site:product-auth-pricing" })
  }

  if (pageTypes.includes("pricing") && pageTypes.includes("features")) {
    signals.push({ intent: "saas", weight: 14, signal: "pages:product-structure" })
  }

  return signals
}

function resolveTopIntent(signals: IntentSignal[]): {
  intent: WebsiteIntent
  confidence: number
  signals: string[]
} {
  if (signals.length === 0) {
    return { intent: "unknown", confidence: 45, signals: ["default:unknown"] }
  }

  const totals = new Map<WebsiteIntent, number>()
  const signalLabels = new Map<WebsiteIntent, string[]>()

  for (const signal of signals) {
    totals.set(signal.intent, (totals.get(signal.intent) ?? 0) + signal.weight)
    const labels = signalLabels.get(signal.intent) ?? []
    labels.push(signal.signal)
    signalLabels.set(signal.intent, labels)
  }

  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1])
  const [topIntent, topScore] = ranked[0]
  const runnerUpScore = ranked[1]?.[1] ?? 0
  const margin = topScore - runnerUpScore
  const confidence = Math.min(96, Math.round(52 + margin * 0.65 + Math.min(topScore, 80) * 0.2))

  return {
    intent: topIntent,
    confidence,
    signals: signalLabels.get(topIntent) ?? [],
  }
}

/**
 * Deterministic site-level intent detection.
 * Known domains lock intent before content heuristics run.
 */
export function detectWebsiteIntent(input: {
  session: AuditSession
  pages: AuditPage[]
  pageSnapshots: PageContentSnapshot[]
}): DetectedWebsiteIntent {
  const hostname = extractHostname(input.session.websiteUrl)
  const domainLocked = resolveDomainLockedIntent(hostname)
  if (domainLocked) {
    return domainLocked
  }

  const signals = collectContentSignals(input)
  const resolved = resolveTopIntent(signals)

  return {
    websiteIntent: resolved.intent,
    confidence: resolved.confidence,
    signals: resolved.signals,
  }
}

export function getHostnameFromSession(session: AuditSession): string {
  return extractHostname(session.websiteUrl)
}

export function peekDomainLockedIntent(hostname: string): WebsiteIntent | null {
  return resolveDomainLockedIntent(hostname.toLowerCase())?.websiteIntent ?? null
}
