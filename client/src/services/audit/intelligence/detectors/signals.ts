import type { SnapshotMetrics } from "@/services/audit/rules/snapshotMetrics"
import type { IntelligenceEvidence } from "@/services/audit/intelligence/types"

const CTA_SELECTORS = [
  "a[class*='btn']",
  "a[class*='button']",
  "a[class*='cta']",
  "button",
  "input[type='submit']",
  "[role='button']",
].join(", ")

const WEAK_CTA_PHRASES = ["click here", "submit", "learn more", "read more", "continue", "go"]

const GENERIC_HEADLINES = ["welcome", "home", "homepage", "hello", "website", "landing page", "our site"]

const VALUE_PROP_SIGNALS = [
  "grow",
  "convert",
  "increase",
  "save",
  "faster",
  "revenue",
  "customers",
  "results",
  "solution",
  "automate",
  "scale",
  "deliver",
  "build",
  "launch",
]

const URGENCY_SIGNALS = ["limited", "today", "now", "spots", "deadline", "exclusive", "book"]

const BENEFIT_SIGNALS = ["benefit", "advantage", "why choose", "how we help", "what you get", "outcome"]

const MISSION_SIGNALS = ["mission", "purpose", "why we", "who we are", "our story", "founded"]

const TEAM_SIGNALS = ["team", "founder", "leadership", "our people", "meet the"]

const OUTCOME_SIGNALS = ["result", "outcome", "increased", "reduced", "achieved", "delivered", "%", "roi"]

const PRICING_SIGNALS = ["plan", "pricing", "per month", "/mo", "tier", "package", "annual", "monthly"]

export type PageSignals = {
  metrics: SnapshotMetrics
  visibleText: string
  visibleTextLower: string
  h1: string | null
  h2Count: number
  h3Count: number
  heroCtaCount: number
  heroCtaLabels: string[]
  navLinkCount: number
  hasNav: boolean
  hasFooter: boolean
  hasMetaDescription: boolean
  hasLeadForm: boolean
  hasContactForm: boolean
  hasTestimonialBlock: boolean
  hasSocialProofBlock: boolean
  hasBenefitsSection: boolean
  hasMissionContent: boolean
  hasTeamContent: boolean
  hasOutcomeContent: boolean
  hasPricingSignals: boolean
  hasUrgencySignals: boolean
  hasWeakCta: boolean
  weakCtaLabels: string[]
  textToDomRatio: number
}

function visibleText(document: Document): string {
  return (document.body?.innerText ?? "").replace(/\s+/g, " ").trim()
}

function getHeroRoot(document: Document): Element {
  return (
    document.querySelector("[class*='hero' i]") ??
    document.querySelector("main section") ??
    document.querySelector("main > div") ??
    document.querySelector("section") ??
    document.body
  )
}

function ctaElements(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll(CTA_SELECTORS)).filter(
    (el): el is HTMLElement => el instanceof HTMLElement
  )
}

function ctaLabel(element: HTMLElement): string {
  return (element.textContent ?? "").replace(/\s+/g, " ").trim()
}

function sectionMatches(document: Document, selectors: string[], textSignals: string[]): boolean {
  for (const selector of selectors) {
    if (document.querySelector(selector)) return true
  }
  const text = visibleText(document).toLowerCase()
  return textSignals.filter((signal) => text.includes(signal)).length >= 2
}

export function analyzePageSignals(document: Document, metrics: SnapshotMetrics): PageSignals {
  const visible = visibleText(document)
  const visibleLower = visible.toLowerCase()
  const hero = getHeroRoot(document)
  const heroCtas = ctaElements(hero).filter((el) => ctaLabel(el).length > 0)
  const allCtas = ctaElements(document)
  const weakCtas = allCtas
    .map(ctaLabel)
    .filter((label) => {
      const normalized = label.toLowerCase()
      return WEAK_CTA_PHRASES.some((p) => normalized === p || normalized.startsWith(`${p} `))
    })

  const nav = document.querySelector("nav, header")
  const h1 = metrics.firstH1 ?? document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim() ?? null

  const hasLeadForm =
    metrics.formCount > 0 &&
    Boolean(document.querySelector("form input[type='email'], form input[name*='email' i]"))

  const hasContactForm =
    metrics.formCount > 0 &&
    Boolean(document.querySelector("form textarea, form input[name*='message' i]"))

  return {
    metrics,
    visibleText: visible,
    visibleTextLower: visibleLower,
    h1,
    h2Count: document.querySelectorAll("h2").length,
    h3Count: document.querySelectorAll("h3").length,
    heroCtaCount: heroCtas.length,
    heroCtaLabels: heroCtas.map(ctaLabel).slice(0, 4),
    navLinkCount: nav?.querySelectorAll("a[href]").length ?? metrics.linkCount,
    hasNav: Boolean(nav),
    hasFooter: Boolean(document.querySelector("footer")),
    hasMetaDescription: Boolean(document.querySelector("meta[name='description' i][content]")),
    hasLeadForm,
    hasContactForm,
    hasTestimonialBlock: sectionMatches(
      document,
      ["[class*='testimonial' i]", "[class*='review' i]", "blockquote"],
      ["testimonial", "what our clients", "customer stories", "rated"]
    ),
    hasSocialProofBlock: sectionMatches(
      document,
      ["[class*='logo' i]", "[class*='client' i]", "[class*='trusted' i]"],
      ["trusted by", "clients include", "companies we", "partners"]
    ),
    hasBenefitsSection: BENEFIT_SIGNALS.filter((s) => visibleLower.includes(s)).length >= 2,
    hasMissionContent: MISSION_SIGNALS.filter((s) => visibleLower.includes(s)).length >= 1,
    hasTeamContent:
      TEAM_SIGNALS.filter((s) => visibleLower.includes(s)).length >= 1 ||
      Boolean(document.querySelector("[class*='team' i], [class*='founder' i]")),
    hasOutcomeContent: OUTCOME_SIGNALS.filter((s) => visibleLower.includes(s)).length >= 2,
    hasPricingSignals: PRICING_SIGNALS.filter((s) => visibleLower.includes(s)).length >= 2,
    hasUrgencySignals: URGENCY_SIGNALS.filter((s) => visibleLower.includes(s)).length >= 1,
    hasWeakCta: weakCtas.length > 0,
    weakCtaLabels: weakCtas.slice(0, 3),
    textToDomRatio: metrics.domLength > 0 ? metrics.visibleTextLength / metrics.domLength : 0,
  }
}

export function isGenericHeadline(headline: string | null): boolean {
  const normalized = (headline ?? "").toLowerCase().trim()
  if (!normalized || normalized.length < 4) return true
  if (normalized.split(/\s+/).length <= 2 && GENERIC_HEADLINES.includes(normalized)) return true
  return GENERIC_HEADLINES.some((p) => normalized === p || normalized.startsWith(`${p} `))
}

export function hasValueProposition(signals: PageSignals): boolean {
  const sample = `${signals.h1 ?? ""} ${signals.visibleTextLower.slice(0, 400)}`
  const hits = VALUE_PROP_SIGNALS.filter((s) => sample.includes(s)).length
  return hits >= 2 && (signals.h1?.length ?? 0) >= 12
}

export function evidence(...items: Array<{ label: string; value: string }>): IntelligenceEvidence[] {
  return items.filter((item) => item.value)
}

export function confidenceFromSignals(signalCount: number, required: number): number {
  const ratio = Math.min(1, signalCount / Math.max(required, 1))
  return Math.round(62 + ratio * 34)
}

export function hasHorizontalOverflowRisk(document: Document): boolean {
  const html = document.documentElement.outerHTML.toLowerCase()
  return (
    html.includes("overflow-x: scroll") ||
    html.includes("overflow-x: auto") ||
    html.includes("width: 100vw") ||
    html.includes("min-width: 100vw")
  )
}

export function hasOversizedImages(document: Document): boolean {
  return Array.from(document.querySelectorAll("img")).some((img) => {
    const width = Number(img.getAttribute("width") ?? 0)
    const hasMaxWidth = (img.getAttribute("style") ?? "").includes("max-width")
    return width > 500 && !hasMaxWidth
  })
}

export function hasSmallTouchTargets(document: Document, metrics: SnapshotMetrics): boolean {
  if (metrics.buttonCount + metrics.linkCount < 3) return false

  const interactive = Array.from(
    document.querySelectorAll("a, button, input[type='submit'], [role='button']")
  )

  const inlineSmall = interactive.some((element) => {
    if (!(element instanceof HTMLElement)) return false
    const style = element.getAttribute("style") ?? ""
    const heightMatch = style.match(/height:\s*(\d+)px/i)
    const widthMatch = style.match(/width:\s*(\d+)px/i)
    const height = heightMatch ? Number(heightMatch[1]) : 0
    const width = widthMatch ? Number(widthMatch[1]) : 0
    return (height > 0 && height < 44) || (width > 0 && width < 44)
  })

  if (inlineSmall) return true

  return metrics.buttonCount >= 4 && metrics.visibleTextLength > 200 && metrics.linkCount > 8
}

export function hasSmallFontRisk(document: Document, metrics: SnapshotMetrics): boolean {
  const styled = Array.from(document.querySelectorAll("[style*='font-size']"))
  const inlineSmall = styled.some((element) => {
    const style = element.getAttribute("style") ?? ""
    const match = style.match(/font-size:\s*(\d+(?:\.\d+)?)px/i)
    return match ? Number(match[1]) < 14 : false
  })
  if (inlineSmall) return true
  return metrics.visibleTextLength > 300 && metrics.domLength > 0 && metrics.visibleTextLength / metrics.domLength < 0.02
}
