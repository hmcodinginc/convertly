import {
  htmlContainsLinkPattern,
  siteHasReachablePageType,
} from "@/services/audit/pageContentService"
import {
  countHeroCtas,
  countNavigationLinks,
  getHeroCtaTexts,
  getPrimaryHeadline,
  getWeakCtaTexts,
  hasContactForm,
  hasCtaBelowFold,
  hasHorizontalOverflowRisk,
  hasLeadCaptureForm,
  hasOversizedImages,
  hasPrimaryCta,
  hasSmallFontSizes,
  hasSmallTouchTargets,
  hasSocialProof,
  hasTestimonials,
  hasUrgencyIndicators,
  hasValueProposition,
  hasViewportMeta,
  hasWeakCtaLanguage,
  isGenericHeadline,
  getHeroValueText,
} from "@/services/audit/rules/htmlAnalyzer"
import {
  auditDomain,
  auditedHtml,
  hasSuccessfulAnalysis,
  homepagePath,
  homepageUrl,
  requireAnalyzablePage,
} from "@/services/audit/rules/ruleHelpers"
import type { AuditRule } from "@/types/auditEngine"
import type { ScoredFindingInput } from "@/services/audit/scoring/calculateAuditScore"

function finding(
  ruleId: string,
  partial: Omit<ScoredFindingInput, "scoreCategory"> & { scoreCategory: ScoredFindingInput["scoreCategory"] }
): ScoredFindingInput {
  return { ...partial, ruleId }
}

export const productionAuditRules: AuditRule[] = [
  {
    id: "hero-missing-primary-cta",
    name: "Missing primary CTA",
    category: "conversion",
    run: async (context) => {
      const snapshot = requireAnalyzablePage(context)
      if (!snapshot?.document || hasPrimaryCta(snapshot.document)) return { findings: [] }

      const domain = auditDomain(context)
      return {
        findings: [
          finding("hero-missing-primary-cta", {
            category: "conversion",
            severity: "high",
            scoreCategory: "conversion",
            title: "Missing primary CTA",
            description: `No prominent CTA was detected above the fold on the homepage (${homepagePath(context)}) for ${domain}.`,
            recommendation: `On ${homepageUrl(context)}, add one prominent hero CTA that states the next step visitors should take (for example: book a call, view work, or start a trial).`,
            pageId: snapshot.page.id,
          }),
        ],
      }
    },
  },
  {
    id: "hero-multiple-competing-ctas",
    name: "Multiple competing CTAs",
    category: "ux",
    run: async (context) => {
      const snapshot = requireAnalyzablePage(context)
      if (!snapshot?.document) return { findings: [] }

      const ctaCount = countHeroCtas(snapshot.document)
      if (ctaCount <= 2) return { findings: [] }

      const ctaLabels = getHeroCtaTexts(snapshot.document).join('", "')
      return {
        findings: [
          finding("hero-multiple-competing-ctas", {
            category: "ux",
            severity: "medium",
            scoreCategory: "ux",
            title: "Multiple competing CTAs",
            description: `The homepage hero on ${auditDomain(context)} exposes ${ctaCount} competing CTAs${ctaLabels ? ` including "${ctaLabels}"` : ""}.`,
            recommendation: `Reduce hero actions on ${homepageUrl(context)} to one primary CTA and at most one lower-emphasis secondary action.`,
            pageId: snapshot.page.id,
          }),
        ],
      }
    },
  },
  {
    id: "hero-cta-below-fold",
    name: "Hero CTA below fold",
    category: "conversion",
    run: async (context) => {
      const snapshot = requireAnalyzablePage(context)
      if (!snapshot?.document || !hasCtaBelowFold(snapshot.document)) return { findings: [] }

      return {
        findings: [
          finding("hero-cta-below-fold", {
            category: "conversion",
            severity: "high",
            scoreCategory: "conversion",
            title: "Hero CTA below fold",
            description: `Visitors on ${homepageUrl(context)} may need to scroll before encountering a meaningful call-to-action.`,
            recommendation: `Move the primary CTA on ${homepagePath(context)} into the first viewport for both desktop and mobile layouts.`,
            pageId: snapshot.page.id,
          }),
        ],
      }
    },
  },
  {
    id: "hero-generic-headline",
    name: "Generic headline",
    category: "copy",
    run: async (context) => {
      const snapshot = requireAnalyzablePage(context)
      if (!snapshot?.document) return { findings: [] }

      const headline = getPrimaryHeadline(snapshot.document)
      if (!isGenericHeadline(headline)) return { findings: [] }

      const headlineText = headline || "missing"
      return {
        findings: [
          finding("hero-generic-headline", {
            category: "copy",
            severity: "medium",
            scoreCategory: "ux",
            title: "Generic headline",
            description: `Homepage headline "${headlineText}" on ${auditDomain(context)} does not communicate a measurable customer outcome.`,
            recommendation: `Rewrite the H1 on ${homepageUrl(context)} to state who you help and the outcome they should expect within one clear sentence.`,
            pageId: snapshot.page.id,
          }),
        ],
      }
    },
  },
  {
    id: "hero-no-value-proposition",
    name: "No value proposition",
    category: "copy",
    run: async (context) => {
      const snapshot = requireAnalyzablePage(context)
      if (!snapshot?.document) return { findings: [] }

      const valueText = getHeroValueText(snapshot.document)
      if (hasValueProposition(valueText)) return { findings: [] }

      const headline = getPrimaryHeadline(snapshot.document)
      return {
        findings: [
          finding("hero-no-value-proposition", {
            category: "copy",
            severity: "high",
            scoreCategory: "ux",
            title: "No value proposition",
            description: `The hero copy on ${homepageUrl(context)}${headline ? ` (headline: "${headline}")` : ""} does not clearly articulate a customer outcome.`,
            recommendation: `Add a concise value proposition beneath the headline on ${auditDomain(context)} that explains the benefit in one sentence.`,
            pageId: snapshot.page.id,
          }),
        ],
      }
    },
  },
  {
    id: "trust-missing-contact-page",
    name: "Missing contact page",
    category: "trust",
    run: async (context) => {
      if (!hasSuccessfulAnalysis(context)) return { findings: [] }
      if (siteHasReachablePageType(context.pages, "contact")) return { findings: [] }

      return {
        findings: [
          finding("trust-missing-contact-page", {
            category: "trust",
            severity: "high",
            scoreCategory: "trust",
            title: "Missing contact page",
            description: `No verified contact page was discovered on ${auditDomain(context)} from homepage navigation links.`,
            recommendation: `Publish a dedicated contact page on ${auditDomain(context)} and link it from the homepage navigation or footer.`,
          }),
        ],
      }
    },
  },
  {
    id: "trust-missing-privacy-policy",
    name: "Missing privacy policy",
    category: "trust",
    run: async (context) => {
      if (!hasSuccessfulAnalysis(context)) return { findings: [] }

      const html = auditedHtml(context)
      const hasPrivacy = htmlContainsLinkPattern(html, [
        /href=["'][^"']*privacy[^"']*["']/i,
        /privacy policy/i,
      ])
      if (hasPrivacy) return { findings: [] }

      return {
        findings: [
          finding("trust-missing-privacy-policy", {
            category: "trust",
            severity: "high",
            scoreCategory: "trust",
            title: "Missing privacy policy",
            description: `No privacy policy link was detected across verified pages on ${auditDomain(context)}.`,
            recommendation: `Add a footer link to a privacy policy on ${auditDomain(context)}, especially if you collect emails or personal information.`,
          }),
        ],
      }
    },
  },
  {
    id: "trust-missing-terms-page",
    name: "Missing terms page",
    category: "trust",
    run: async (context) => {
      if (!hasSuccessfulAnalysis(context)) return { findings: [] }

      const html = auditedHtml(context)
      const hasTerms = htmlContainsLinkPattern(html, [
        /href=["'][^"']*terms[^"']*["']/i,
        /terms of service/i,
        /terms & conditions/i,
      ])
      if (hasTerms) return { findings: [] }

      return {
        findings: [
          finding("trust-missing-terms-page", {
            category: "trust",
            severity: "medium",
            scoreCategory: "trust",
            title: "Missing terms page",
            description: `No terms of service link was detected across verified pages on ${auditDomain(context)}.`,
            recommendation: `Publish terms of service on ${auditDomain(context)} and link them from the site footer.`,
          }),
        ],
      }
    },
  },
  {
    id: "trust-no-testimonials",
    name: "No testimonials detected",
    category: "trust",
    run: async (context) => {
      const snapshot = requireAnalyzablePage(context)
      if (!snapshot?.document || hasTestimonials(snapshot.document)) return { findings: [] }

      return {
        findings: [
          finding("trust-no-testimonials", {
            category: "trust",
            severity: "medium",
            scoreCategory: "trust",
            title: "No testimonials detected",
            description: `No testimonials, review ratings, or customer quote language was detected on ${homepageUrl(context)}.`,
            recommendation: `Add customer quotes or short proof points on ${auditDomain(context)} near the primary conversion path.`,
            pageId: snapshot.page.id,
          }),
        ],
      }
    },
  },
  {
    id: "trust-no-social-proof",
    name: "No social proof detected",
    category: "trust",
    run: async (context) => {
      const snapshot = requireAnalyzablePage(context)
      if (!snapshot?.document || hasSocialProof(snapshot.document)) return { findings: [] }

      return {
        findings: [
          finding("trust-no-social-proof", {
            category: "trust",
            severity: "medium",
            scoreCategory: "trust",
            title: "No social proof detected",
            description: `No testimonials, customer logos, review ratings, or case studies were detected on ${homepageUrl(context)}.`,
            recommendation: `Add recognizable social proof on ${auditDomain(context)} such as client logos, usage metrics, or outcome stats near the hero.`,
            pageId: snapshot.page.id,
          }),
        ],
      }
    },
  },
  {
    id: "conversion-no-lead-capture",
    name: "No lead capture form",
    category: "conversion",
    run: async (context) => {
      const snapshot = requireAnalyzablePage(context)
      if (!snapshot?.document || hasLeadCaptureForm(snapshot.document)) return { findings: [] }

      return {
        findings: [
          finding("conversion-no-lead-capture", {
            category: "conversion",
            severity: "high",
            scoreCategory: "conversion",
            title: "No lead capture form",
            description: `No email capture or lead form was detected on ${homepageUrl(context)}.`,
            recommendation: `Introduce a lightweight lead capture field on ${auditDomain(context)} tied to a clear incentive or next step.`,
            pageId: snapshot.page.id,
          }),
        ],
      }
    },
  },
  {
    id: "conversion-no-contact-form",
    name: "No contact form",
    category: "conversion",
    run: async (context) => {
      const contactPage = context.pages.find((page) => page.pageType === "contact")
      const contactSnapshot = context.pageSnapshots.find(
        (snapshot) => snapshot.page.pageType === "contact" && snapshot.fetchSucceeded
      )

      if (!contactSnapshot?.document) return { findings: [] }
      if (hasContactForm(contactSnapshot.document)) return { findings: [] }

      return {
        findings: [
          finding("conversion-no-contact-form", {
            category: "conversion",
            severity: "medium",
            scoreCategory: "conversion",
            title: "No contact form",
            description: `No contact or message form was detected on ${contactSnapshot.page.url}.`,
            recommendation: `Add a simple contact form on ${contactPage?.path ?? contactSnapshot.page.path} with name, email, and message fields.`,
            pageId: contactPage?.id ?? contactSnapshot.page.id,
          }),
        ],
      }
    },
  },
  {
    id: "conversion-weak-cta-language",
    name: "Weak CTA language",
    category: "copy",
    run: async (context) => {
      const snapshot = requireAnalyzablePage(context)
      if (!snapshot?.document || !hasWeakCtaLanguage(snapshot.document)) return { findings: [] }

      const weakCtas = getWeakCtaTexts(snapshot.document)
      const examples = weakCtas.length > 0 ? `"${weakCtas.join('", "')}"` : "low-intent CTA copy"

      return {
        findings: [
          finding("conversion-weak-cta-language", {
            category: "copy",
            severity: "medium",
            scoreCategory: "conversion",
            title: "Weak CTA language",
            description: `On ${homepageUrl(context)}, CTA copy such as ${examples} does not communicate a specific outcome.`,
            recommendation: `Replace low-intent CTA text on ${auditDomain(context)} with outcome-oriented language that states the value of clicking.`,
            pageId: snapshot.page.id,
          }),
        ],
      }
    },
  },
  {
    id: "conversion-too-many-nav-links",
    name: "Too many navigation links",
    category: "ux",
    run: async (context) => {
      const snapshot = requireAnalyzablePage(context)
      if (!snapshot?.document) return { findings: [] }

      const linkCount = countNavigationLinks(snapshot.document)
      if (linkCount <= 8) return { findings: [] }

      return {
        findings: [
          finding("conversion-too-many-nav-links", {
            category: "ux",
            severity: "medium",
            scoreCategory: "ux",
            title: "Too many navigation links",
            description: `The header navigation on ${homepageUrl(context)} exposes ${linkCount} links, which can increase decision friction.`,
            recommendation: `Consolidate navigation on ${auditDomain(context)} into fewer high-intent destinations and move secondary links to the footer.`,
            pageId: snapshot.page.id,
          }),
        ],
      }
    },
  },
  {
    id: "conversion-no-urgency",
    name: "No urgency indicators",
    category: "conversion",
    run: async (context) => {
      const snapshot = requireAnalyzablePage(context)
      if (!snapshot?.document || hasUrgencyIndicators(snapshot.document)) return { findings: [] }

      return {
        findings: [
          finding("conversion-no-urgency", {
            category: "conversion",
            severity: "low",
            scoreCategory: "conversion",
            title: "No urgency indicators",
            description: `The homepage at ${homepageUrl(context)} does not communicate time-bound motivation to act.`,
            recommendation: `Test ethical urgency cues on ${auditDomain(context)} near the primary CTA, such as limited onboarding availability.`,
            pageId: snapshot.page.id,
          }),
        ],
      }
    },
  },
  {
    id: "mobile-missing-viewport-meta",
    name: "Missing viewport meta",
    category: "technical",
    run: async (context) => {
      const snapshot = requireAnalyzablePage(context)
      if (!snapshot?.document || hasViewportMeta(snapshot.document)) return { findings: [] }

      return {
        findings: [
          finding("mobile-missing-viewport-meta", {
            category: "technical",
            severity: "high",
            scoreCategory: "mobile",
            title: "Missing viewport meta",
            description: `The homepage at ${homepageUrl(context)} is missing a mobile viewport meta tag.`,
            recommendation: `Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the head of ${auditDomain(context)}.`,
            pageId: snapshot.page.id,
          }),
        ],
      }
    },
  },
  {
    id: "mobile-small-touch-targets",
    name: "Touch targets too small",
    category: "accessibility",
    run: async (context) => {
      const snapshot = requireAnalyzablePage(context)
      if (!snapshot?.document || !hasSmallTouchTargets(snapshot.document)) return { findings: [] }

      return {
        findings: [
          finding("mobile-small-touch-targets", {
            category: "accessibility",
            severity: "medium",
            scoreCategory: "mobile",
            title: "Touch targets too small",
            description: `Interactive elements on ${homepageUrl(context)} may be smaller than the recommended 44px touch target size.`,
            recommendation: `Increase button and link padding on ${auditDomain(context)} so tap targets are at least 44x44px on mobile.`,
            pageId: snapshot.page.id,
          }),
        ],
      }
    },
  },
  {
    id: "mobile-horizontal-overflow",
    name: "Horizontal overflow detected",
    category: "technical",
    run: async (context) => {
      const snapshot = requireAnalyzablePage(context)
      if (!snapshot?.document || !hasHorizontalOverflowRisk(snapshot.document)) return { findings: [] }

      return {
        findings: [
          finding("mobile-horizontal-overflow", {
            category: "technical",
            severity: "high",
            scoreCategory: "mobile",
            title: "Horizontal overflow detected",
            description: `The markup on ${homepageUrl(context)} suggests horizontal scrolling risk on smaller viewports.`,
            recommendation: `Audit wide sections on ${auditDomain(context)} and use max-width: 100% on images and containers for mobile.`,
            pageId: snapshot.page.id,
          }),
        ],
      }
    },
  },
  {
    id: "mobile-small-font-sizes",
    name: "Font sizes too small",
    category: "accessibility",
    run: async (context) => {
      const snapshot = requireAnalyzablePage(context)
      if (!snapshot?.document || !hasSmallFontSizes(snapshot.document)) return { findings: [] }

      return {
        findings: [
          finding("mobile-small-font-sizes", {
            category: "accessibility",
            severity: "medium",
            scoreCategory: "mobile",
            title: "Font sizes too small",
            description: `Inline styles on ${homepageUrl(context)} suggest text smaller than 14px in some sections.`,
            recommendation: `Keep body copy at 16px on mobile across ${auditDomain(context)} and avoid inline font sizes below 14px.`,
            pageId: snapshot.page.id,
          }),
        ],
      }
    },
  },
  {
    id: "mobile-oversized-images",
    name: "Images larger than viewport",
    category: "performance",
    run: async (context) => {
      const snapshot = requireAnalyzablePage(context)
      if (!snapshot?.document || !hasOversizedImages(snapshot.document)) return { findings: [] }

      return {
        findings: [
          finding("mobile-oversized-images", {
            category: "performance",
            severity: "medium",
            scoreCategory: "mobile",
            title: "Images larger than viewport",
            description: `Large fixed-width images without responsive constraints were detected on ${homepageUrl(context)}.`,
            recommendation: `Serve responsive images on ${auditDomain(context)} with max-width: 100% and appropriate srcset sizes.`,
            pageId: snapshot.page.id,
          }),
        ],
      }
    },
  },
]
