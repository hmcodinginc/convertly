import type { DetectorResult } from "@/services/audit/intelligence/types"
import {
  analyzePageSignals,
  confidenceFromSignals,
  evidence,
  hasHorizontalOverflowRisk,
  hasOversizedImages,
  hasSmallFontRisk,
  hasSmallTouchTargets,
  hasValueProposition,
  isGenericHeadline,
} from "@/services/audit/intelligence/detectors/signals"
import { buildPageDetectorContext, type PageDetectorContext } from "@/services/audit/intelligence/detectors/context"

export type PageDetector = (ctx: PageDetectorContext) => DetectorResult

function pass(): DetectorResult {
  return { triggered: false, confidence: 0, evidence: [] }
}

function fail(
  confidence: number,
  items: Array<{ label: string; value: string }>
): DetectorResult {
  return { triggered: true, confidence, evidence: evidence(...items) }
}

function ctx(context: Parameters<typeof buildPageDetectorContext>[0]): PageDetectorContext | null {
  return buildPageDetectorContext(context)
}

export const PAGE_DETECTORS: Record<string, PageDetector> = {
  "tech-missing-viewport": (c) =>
    c.metrics.hasViewportMeta
      ? pass()
      : fail(92, [
          { label: "Viewport meta", value: "Missing on rendered page" },
          { label: "Path", value: c.pagePath },
        ]),

  "tech-horizontal-overflow": (c) =>
    hasHorizontalOverflowRisk(c.document)
      ? fail(85, [{ label: "Overflow risk", value: "Horizontal scroll patterns detected in markup" }])
      : pass(),

  "tech-oversized-images": (c) =>
    hasOversizedImages(c.document)
      ? fail(78, [{ label: "Images", value: "Fixed-width images without responsive constraints" }])
      : pass(),

  "tech-thin-content": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.metrics.visibleTextLength >= 180) return pass()
    return fail(confidenceFromSignals(1, 1), [
      { label: "Visible text", value: `${s.metrics.visibleTextLength} characters` },
      { label: "Headings", value: String(s.metrics.headingCount) },
    ])
  },

  "tech-missing-h1": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.h1 && s.h1.length >= 3) return pass()
    return fail(88, [
      { label: "H1", value: s.h1 ?? "Not detected" },
      { label: "Headings", value: String(s.metrics.headingCount) },
    ])
  },

  "tech-weak-heading-structure": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.metrics.visibleTextLength < 250) return pass()
    if (s.h1 && s.h2Count >= 1) return pass()
    return fail(76, [
      { label: "H1", value: s.h1 ?? "Missing" },
      { label: "H2 count", value: String(s.h2Count) },
      { label: "Visible text", value: `${s.metrics.visibleTextLength} chars` },
    ])
  },

  "tech-missing-meta-description": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.hasMetaDescription) return pass()
    return fail(80, [
      { label: "Meta description", value: "Not found" },
      { label: "Page title", value: s.metrics.documentTitle ?? "Unset" },
    ])
  },

  "tech-missing-page-title": (c) => {
    const title = c.metrics.documentTitle?.trim()
    if (title && title.length >= 3) return pass()
    return fail(86, [{ label: "document.title", value: title ?? "Empty or missing" }])
  },

  "tech-heavy-dom": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (c.metrics.domLength < 80_000) return pass()
    if (s.textToDomRatio >= 0.04) return pass()
    return fail(72, [
      { label: "DOM size", value: `${c.metrics.domLength} chars` },
      { label: "Visible text", value: `${s.metrics.visibleTextLength} chars` },
    ])
  },

  "a11y-small-touch-targets": (c) =>
    hasSmallTouchTargets(c.document, c.metrics)
      ? fail(74, [
          { label: "Buttons", value: String(c.metrics.buttonCount) },
          { label: "Links", value: String(c.metrics.linkCount) },
        ])
      : pass(),

  "a11y-small-font-sizes": (c) =>
    hasSmallFontRisk(c.document, c.metrics)
      ? fail(70, [{ label: "Text density", value: "Low readable text relative to markup volume" }])
      : pass(),

  "a11y-missing-landmarks": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.hasNav && s.hasFooter) return pass()
    return fail(68, [
      { label: "Navigation", value: s.hasNav ? "Present" : "Not detected" },
      { label: "Footer", value: s.hasFooter ? "Present" : "Not detected" },
    ])
  },

  "hero-missing-primary-cta": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.heroCtaCount > 0 || s.metrics.buttonCount >= 2) return pass()
    return fail(90, [
      { label: "Hero CTAs", value: String(s.heroCtaCount) },
      { label: "Buttons", value: String(s.metrics.buttonCount) },
    ])
  },

  "hero-multiple-competing-ctas": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.heroCtaCount <= 2) return pass()
    return fail(82, [
      { label: "Hero CTAs", value: String(s.heroCtaCount) },
      { label: "Labels", value: s.heroCtaLabels.join(", ") || "n/a" },
    ])
  },

  "hero-cta-below-fold": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.heroCtaCount > 0) return pass()
    if (s.metrics.buttonCount === 0) return pass()
    return fail(84, [
      { label: "Hero CTAs", value: "0 in hero region" },
      { label: "Page buttons", value: String(s.metrics.buttonCount) },
    ])
  },

  "hero-generic-headline": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (!isGenericHeadline(s.h1)) return pass()
    return fail(80, [{ label: "H1", value: s.h1 ?? "Missing or generic" }])
  },

  "hero-no-value-proposition": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (hasValueProposition(s)) return pass()
    return fail(86, [
      { label: "H1", value: s.h1 ?? "Missing" },
      { label: "Visible text sample", value: s.visibleText.slice(0, 120) || "n/a" },
    ])
  },

  "conversion-weak-cta-language": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (!s.hasWeakCta) return pass()
    return fail(78, [{ label: "Weak CTAs", value: s.weakCtaLabels.join('", "') }])
  },

  "conversion-too-many-nav-links": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.navLinkCount <= 8) return pass()
    return fail(75, [{ label: "Nav links", value: String(s.navLinkCount) }])
  },

  "conversion-no-urgency": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.hasUrgencySignals || s.metrics.buttonCount === 0) return pass()
    return fail(62, [{ label: "Urgency signals", value: "None detected near conversion path" }])
  },

  "conversion-no-lead-capture": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.hasLeadForm || s.metrics.formCount > 0) return pass()
    return fail(88, [
      { label: "Forms", value: String(s.metrics.formCount) },
      { label: "Email fields", value: "None detected" },
    ])
  },

  "trust-no-testimonials": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.hasTestimonialBlock) return pass()
    return fail(76, [
      { label: "Testimonial block", value: "Not detected" },
      { label: "Headings", value: String(s.metrics.headingCount) },
    ])
  },

  "trust-no-social-proof": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.hasSocialProofBlock || s.hasTestimonialBlock) return pass()
    return fail(74, [
      { label: "Social proof", value: "No logo strip, client section, or trust copy cluster" },
    ])
  },

  "services-thin-page": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.metrics.visibleTextLength >= 350) return pass()
    return fail(82, [{ label: "Visible text", value: `${s.metrics.visibleTextLength} chars` }])
  },

  "services-missing-cta": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.metrics.buttonCount >= 1 || s.metrics.linkCount >= 6) return pass()
    return fail(84, [
      { label: "Buttons", value: String(s.metrics.buttonCount) },
      { label: "Links", value: String(s.metrics.linkCount) },
    ])
  },

  "services-unclear-offering": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.h1 && s.h2Count >= 1 && s.metrics.visibleTextLength >= 280) return pass()
    return fail(80, [
      { label: "H1", value: s.h1 ?? "Missing" },
      { label: "H2 sections", value: String(s.h2Count) },
    ])
  },

  "services-few-internal-links": (c) => {
    if (c.metrics.linkCount >= 5) return pass()
    return fail(70, [{ label: "Links", value: String(c.metrics.linkCount) }])
  },

  "services-no-proof": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.hasSocialProofBlock || s.hasTestimonialBlock || s.hasOutcomeContent) return pass()
    return fail(76, [{ label: "Proof signals", value: "No testimonials, outcomes, or client proof detected" }])
  },

  "services-missing-benefits": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.hasBenefitsSection || s.h3Count >= 2) return pass()
    return fail(72, [{ label: "Benefit sections", value: "Not detected" }])
  },

  "services-shallow-explanation": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.metrics.visibleTextLength >= 500 && s.h2Count >= 2) return pass()
    return fail(78, [
      { label: "Visible text", value: `${s.metrics.visibleTextLength} chars` },
      { label: "H2 sections", value: String(s.h2Count) },
    ])
  },

  "about-thin-story": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.metrics.visibleTextLength >= 320) return pass()
    return fail(80, [{ label: "Visible text", value: `${s.metrics.visibleTextLength} chars` }])
  },

  "about-missing-mission": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.hasMissionContent) return pass()
    return fail(74, [{ label: "Mission copy", value: "No mission or purpose language detected" }])
  },

  "about-no-credibility": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.hasTeamContent || s.hasSocialProofBlock || s.hasOutcomeContent) return pass()
    return fail(72, [{ label: "Credibility", value: "No team, proof, or outcome signals" }])
  },

  "about-missing-contact-path": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    const hasContactLink = /contact|get in touch|book a call|schedule/i.test(s.visibleTextLower)
    if (hasContactLink || s.metrics.linkCount >= 4) return pass()
    return fail(76, [{ label: "Contact path", value: "No contact CTA or link language detected" }])
  },

  "about-missing-team": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.hasTeamContent) return pass()
    return fail(68, [{ label: "Team section", value: "Not detected" }])
  },

  "contact-no-form": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.hasContactForm || s.metrics.formCount > 0) return pass()
    return fail(90, [{ label: "Forms", value: String(s.metrics.formCount) }])
  },

  "contact-missing-email-path": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    const hasEmail = /mailto:|@|email/i.test(c.document.documentElement.outerHTML)
    if (hasEmail || s.hasContactForm) return pass()
    return fail(82, [{ label: "Email path", value: "No mailto link or email field detected" }])
  },

  "contact-single-touchpoint": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    const channels = [s.hasContactForm, /mailto:/i.test(c.document.documentElement.outerHTML), /phone|call|tel:/i.test(s.visibleTextLower)].filter(Boolean).length
    if (channels >= 2) return pass()
    return fail(70, [{ label: "Contact channels", value: String(channels) }])
  },

  "contact-missing-cta": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.metrics.buttonCount >= 1) return pass()
    return fail(78, [{ label: "Buttons", value: String(s.metrics.buttonCount) }])
  },

  "contact-thin-page": (c) => {
    if (c.metrics.visibleTextLength >= 120) return pass()
    return fail(76, [{ label: "Visible text", value: `${c.metrics.visibleTextLength} chars` }])
  },

  "contact-missing-business-info": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    const hasBiz = /address|location|hours|phone|email|@/i.test(s.visibleTextLower)
    if (hasBiz) return pass()
    return fail(72, [{ label: "Business info", value: "No address, phone, or email context detected" }])
  },

  "projects-thin-case-study": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.metrics.visibleTextLength >= 400) return pass()
    return fail(82, [{ label: "Visible text", value: `${s.metrics.visibleTextLength} chars` }])
  },

  "projects-missing-outcomes": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.hasOutcomeContent) return pass()
    return fail(80, [{ label: "Outcomes", value: "No measurable results or outcome language" }])
  },

  "projects-missing-cta": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.metrics.buttonCount >= 1) return pass()
    return fail(78, [{ label: "Buttons", value: String(s.metrics.buttonCount) }])
  },

  "projects-low-supporting-copy": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.h2Count >= 2 && s.metrics.visibleTextLength >= 350) return pass()
    return fail(74, [
      { label: "H2 sections", value: String(s.h2Count) },
      { label: "Visible text", value: `${s.metrics.visibleTextLength} chars` },
    ])
  },

  "projects-missing-structure": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.h1 && s.h2Count >= 1) return pass()
    return fail(72, [
      { label: "H1", value: s.h1 ?? "Missing" },
      { label: "H2", value: String(s.h2Count) },
    ])
  },

  "pricing-thin-page": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.metrics.visibleTextLength >= 280) return pass()
    return fail(80, [{ label: "Visible text", value: `${s.metrics.visibleTextLength} chars` }])
  },

  "pricing-missing-cta": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.metrics.buttonCount >= 1) return pass()
    return fail(86, [{ label: "Buttons", value: String(s.metrics.buttonCount) }])
  },

  "pricing-unclear-plans": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.hasPricingSignals && s.h2Count >= 1) return pass()
    return fail(78, [{ label: "Pricing structure", value: "Plan or tier language not detected" }])
  },

  "pricing-missing-trust": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.hasSocialProofBlock || s.hasTestimonialBlock) return pass()
    return fail(70, [{ label: "Trust", value: "No proof near pricing decision point" }])
  },

  "blog-thin-article": (c) => {
    if (c.metrics.visibleTextLength >= 450) return pass()
    return fail(80, [{ label: "Visible text", value: `${c.metrics.visibleTextLength} chars` }])
  },

  "blog-missing-headings": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.h2Count >= 2) return pass()
    return fail(76, [{ label: "H2 count", value: String(s.h2Count) }])
  },

  "blog-weak-title": (c) => {
    const title = c.metrics.documentTitle?.trim()
    if (title && title.length >= 20) return pass()
    return fail(72, [{ label: "Title", value: title ?? "Missing or too short" }])
  },

  "blog-low-readability": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.metrics.visibleTextLength < 300) return pass()
    if (s.h2Count >= 2 && s.metrics.headingCount >= 4) return pass()
    return fail(68, [
      { label: "Headings", value: String(s.metrics.headingCount) },
      { label: "H2", value: String(s.h2Count) },
    ])
  },

  "legal-thin-policy": (c) => {
    if (c.metrics.visibleTextLength >= 600) return pass()
    return fail(84, [{ label: "Visible text", value: `${c.metrics.visibleTextLength} chars` }])
  },

  "legal-missing-headings": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.h2Count >= 3) return pass()
    return fail(78, [{ label: "H2 sections", value: String(s.h2Count) }])
  },

  "legal-missing-contact-reference": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (/contact|email|@|privacy officer/i.test(s.visibleTextLower)) return pass()
    return fail(74, [{ label: "Contact reference", value: "Not found in policy body" }])
  },

  "features-thin-page": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.metrics.visibleTextLength >= 300) return pass()
    return fail(78, [{ label: "Visible text", value: `${s.metrics.visibleTextLength} chars` }])
  },

  "features-missing-cta": (c) => {
    const s = analyzePageSignals(c.document, c.metrics)
    if (s.metrics.buttonCount >= 1) return pass()
    return fail(76, [{ label: "Buttons", value: String(s.metrics.buttonCount) }])
  },

  "signup-missing-form": (c) => {
    if (c.metrics.formCount > 0) return pass()
    return fail(88, [{ label: "Forms", value: String(c.metrics.formCount) }])
  },

  "signup-thin-page": (c) => {
    if (c.metrics.visibleTextLength >= 80) return pass()
    return fail(74, [{ label: "Visible text", value: `${c.metrics.visibleTextLength} chars` }])
  },

  "login-missing-form": (c) => {
    if (c.metrics.formCount > 0) return pass()
    return fail(86, [{ label: "Forms", value: String(c.metrics.formCount) }])
  },
}

export function runPageDetector(
  ruleId: string,
  context: Parameters<typeof buildPageDetectorContext>[0]
): DetectorResult {
  const pageCtx = ctx(context)
  if (!pageCtx) return pass()
  const detector = PAGE_DETECTORS[ruleId]
  if (!detector) return pass()
  return detector(pageCtx)
}
