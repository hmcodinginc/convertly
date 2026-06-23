import {
  getHomepageSnapshot,
  htmlContainsLinkPattern,
  siteHasReachablePageType,
} from "@/services/audit/pageContentService"
import {
  countHeroCtas,
  countNavigationLinks,
  getPrimaryHeadline,
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
import type { AuditRule, AuditRuleContext } from "@/types/auditEngine"
import type { ScoredFindingInput } from "@/services/audit/scoring/calculateAuditScore"

function homepageDoc(context: AuditRuleContext): Document | null {
  return getHomepageSnapshot(context.pageSnapshots)?.document ?? null
}

function allHtml(context: AuditRuleContext): string {
  return context.pageSnapshots
    .map((snapshot) => snapshot.html ?? "")
    .join("\n")
}

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
      const doc = homepageDoc(context)
      if (!doc || hasPrimaryCta(doc)) return { findings: [] }

      const homepage = getHomepageSnapshot(context.pageSnapshots)?.page
      return {
        findings: [
          finding("hero-missing-primary-cta", {
            category: "conversion",
            severity: "high",
            scoreCategory: "conversion",
            title: "Missing primary CTA",
            description:
              "The hero section does not expose a clear primary call-to-action above the fold.",
            recommendation:
              "Add one prominent CTA in the hero that states the next step (e.g. Start free trial, Book a demo).",
            pageId: homepage?.id,
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
      const doc = homepageDoc(context)
      if (!doc) return { findings: [] }

      const ctaCount = countHeroCtas(doc)
      if (ctaCount <= 2) return { findings: [] }

      const homepage = getHomepageSnapshot(context.pageSnapshots)?.page
      return {
        findings: [
          finding("hero-multiple-competing-ctas", {
            category: "ux",
            severity: "medium",
            scoreCategory: "ux",
            title: "Multiple competing CTAs",
            description: `The hero contains ${ctaCount} competing calls-to-action, which can dilute visitor focus.`,
            recommendation:
              "Reduce the hero to one primary CTA and optionally one secondary action with lower visual weight.",
            pageId: homepage?.id,
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
      const doc = homepageDoc(context)
      if (!doc || !hasCtaBelowFold(doc)) return { findings: [] }

      const homepage = getHomepageSnapshot(context.pageSnapshots)?.page
      return {
        findings: [
          finding("hero-cta-below-fold", {
            category: "conversion",
            severity: "high",
            scoreCategory: "conversion",
            title: "Hero CTA below fold",
            description:
              "Visitors may need to scroll before encountering a meaningful call-to-action.",
            recommendation:
              "Place the primary CTA within the first viewport of the hero on desktop and mobile.",
            pageId: homepage?.id,
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
      const doc = homepageDoc(context)
      if (!doc) return { findings: [] }

      const headline = getPrimaryHeadline(doc)
      if (!isGenericHeadline(headline)) return { findings: [] }

      const homepage = getHomepageSnapshot(context.pageSnapshots)?.page
      return {
        findings: [
          finding("hero-generic-headline", {
            category: "copy",
            severity: "medium",
            scoreCategory: "ux",
            title: "Generic headline",
            description: `The main headline "${headline || "is missing"}" does not communicate a specific outcome.`,
            recommendation:
              "Rewrite the H1 to state who you help and the measurable outcome they should expect.",
            pageId: homepage?.id,
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
      const doc = homepageDoc(context)
      if (!doc) return { findings: [] }

      const valueText = getHeroValueText(doc)
      if (hasValueProposition(valueText)) return { findings: [] }

      const homepage = getHomepageSnapshot(context.pageSnapshots)?.page
      return {
        findings: [
          finding("hero-no-value-proposition", {
            category: "copy",
            severity: "high",
            scoreCategory: "ux",
            title: "No value proposition",
            description:
              "The hero copy does not clearly articulate the product value or customer outcome.",
            recommendation:
              "Add a concise value proposition beneath the headline that explains the benefit within one sentence.",
            pageId: homepage?.id,
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
      if (siteHasReachablePageType(context.pages, "contact")) return { findings: [] }

      return {
        findings: [
          finding("trust-missing-contact-page", {
            category: "trust",
            severity: "high",
            scoreCategory: "trust",
            title: "Missing contact page",
            description: "No reachable contact page was discovered during the audit.",
            recommendation:
              "Publish a dedicated contact page with email, form, or support channel to improve buyer confidence.",
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
      const html = allHtml(context)
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
            description: "No privacy policy link was detected across audited pages.",
            recommendation:
              "Add a footer link to your privacy policy, especially if you collect emails or payment details.",
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
      const html = allHtml(context)
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
            description: "No terms of service page or link was detected.",
            recommendation:
              "Publish terms of service and link them in the footer to reinforce legitimacy.",
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
      const doc = homepageDoc(context)
      if (!doc || hasTestimonials(doc)) return { findings: [] }

      const homepage = getHomepageSnapshot(context.pageSnapshots)?.page
      return {
        findings: [
          finding("trust-no-testimonials", {
            category: "trust",
            severity: "medium",
            scoreCategory: "trust",
            title: "No testimonials detected",
            description: "No testimonial or review language was found on the homepage.",
            recommendation:
              "Add customer quotes, ratings, or short case snippets near the primary conversion path.",
            pageId: homepage?.id,
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
      const doc = homepageDoc(context)
      if (!doc || hasSocialProof(doc)) return { findings: [] }

      const homepage = getHomepageSnapshot(context.pageSnapshots)?.page
      return {
        findings: [
          finding("trust-no-social-proof", {
            category: "trust",
            severity: "medium",
            scoreCategory: "trust",
            title: "No social proof detected",
            description:
              "The homepage lacks recognizable social proof such as customer logos, usage stats, or trust badges.",
            recommendation:
              "Add a logo strip, customer count, or outcome metric near the hero to reduce hesitation.",
            pageId: homepage?.id,
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
      const doc = homepageDoc(context)
      if (!doc || hasLeadCaptureForm(doc)) return { findings: [] }

      const homepage = getHomepageSnapshot(context.pageSnapshots)?.page
      return {
        findings: [
          finding("conversion-no-lead-capture", {
            category: "conversion",
            severity: "high",
            scoreCategory: "conversion",
            title: "No lead capture form",
            description: "No email capture or lead form was detected on the homepage.",
            recommendation:
              "Introduce a lightweight lead capture form or email field tied to a clear incentive.",
            pageId: homepage?.id,
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
      const snapshots = context.pageSnapshots
      const contactSnapshot = snapshots.find(
        (snapshot) => snapshot.page.pageType === "contact"
      )

      const doc = contactSnapshot?.document ?? homepageDoc(context)
      if (!doc || hasContactForm(doc)) return { findings: [] }

      return {
        findings: [
          finding("conversion-no-contact-form", {
            category: "conversion",
            severity: "medium",
            scoreCategory: "conversion",
            title: "No contact form",
            description: "No contact or message form was detected on key conversion pages.",
            recommendation:
              "Add a simple contact form with name, email, and message fields on the contact page.",
            pageId: contactPage?.id,
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
      const doc = homepageDoc(context)
      if (!doc || !hasWeakCtaLanguage(doc)) return { findings: [] }

      const homepage = getHomepageSnapshot(context.pageSnapshots)?.page
      return {
        findings: [
          finding("conversion-weak-cta-language", {
            category: "copy",
            severity: "medium",
            scoreCategory: "conversion",
            title: "Weak CTA language",
            description:
              'One or more CTAs use low-intent language such as "Click here" or "Learn more" without context.',
            recommendation:
              "Use outcome-oriented CTA copy that states the value of clicking (e.g. Get my free audit).",
            pageId: homepage?.id,
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
      const doc = homepageDoc(context)
      if (!doc) return { findings: [] }

      const linkCount = countNavigationLinks(doc)
      if (linkCount <= 8) return { findings: [] }

      const homepage = getHomepageSnapshot(context.pageSnapshots)?.page
      return {
        findings: [
          finding("conversion-too-many-nav-links", {
            category: "ux",
            severity: "medium",
            scoreCategory: "ux",
            title: "Too many navigation links",
            description: `The header navigation exposes ${linkCount} links, which can increase decision friction.`,
            recommendation:
              "Consolidate navigation into fewer high-intent destinations and move secondary links to the footer.",
            pageId: homepage?.id,
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
      const doc = homepageDoc(context)
      if (!doc || hasUrgencyIndicators(doc)) return { findings: [] }

      const homepage = getHomepageSnapshot(context.pageSnapshots)?.page
      return {
        findings: [
          finding("conversion-no-urgency", {
            category: "conversion",
            severity: "low",
            scoreCategory: "conversion",
            title: "No urgency indicators",
            description:
              "The homepage does not communicate time-bound or scarcity-based motivation to act.",
            recommendation:
              "Test ethical urgency cues near the CTA such as limited onboarding slots or trial expiration.",
            pageId: homepage?.id,
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
      const doc = homepageDoc(context)
      if (!doc || hasViewportMeta(doc)) return { findings: [] }

      const homepage = getHomepageSnapshot(context.pageSnapshots)?.page
      return {
        findings: [
          finding("mobile-missing-viewport-meta", {
            category: "technical",
            severity: "high",
            scoreCategory: "mobile",
            title: "Missing viewport meta",
            description:
              "The homepage is missing a mobile viewport meta tag, which harms responsive rendering.",
            recommendation:
              'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the document head.',
            pageId: homepage?.id,
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
      const doc = homepageDoc(context)
      if (!doc || !hasSmallTouchTargets(doc)) return { findings: [] }

      const homepage = getHomepageSnapshot(context.pageSnapshots)?.page
      return {
        findings: [
          finding("mobile-small-touch-targets", {
            category: "accessibility",
            severity: "medium",
            scoreCategory: "mobile",
            title: "Touch targets too small",
            description:
              "Interactive elements may be smaller than the recommended 44px touch target size.",
            recommendation:
              "Increase button and link padding so tap targets are at least 44x44px on mobile.",
            pageId: homepage?.id,
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
      const doc = homepageDoc(context)
      if (!doc || !hasHorizontalOverflowRisk(doc)) return { findings: [] }

      const homepage = getHomepageSnapshot(context.pageSnapshots)?.page
      return {
        findings: [
          finding("mobile-horizontal-overflow", {
            category: "technical",
            severity: "high",
            scoreCategory: "mobile",
            title: "Horizontal overflow detected",
            description:
              "The page markup suggests horizontal scrolling risk on smaller viewports.",
            recommendation:
              "Audit wide sections and images; use max-width: 100% and eliminate 100vw containers on mobile.",
            pageId: homepage?.id,
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
      const doc = homepageDoc(context)
      if (!doc || !hasSmallFontSizes(doc)) return { findings: [] }

      const homepage = getHomepageSnapshot(context.pageSnapshots)?.page
      return {
        findings: [
          finding("mobile-small-font-sizes", {
            category: "accessibility",
            severity: "medium",
            scoreCategory: "mobile",
            title: "Font sizes too small",
            description: "Inline styles suggest text smaller than 14px on parts of the page.",
            recommendation:
              "Keep body copy at 16px on mobile and avoid inline font sizes below 14px.",
            pageId: homepage?.id,
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
      const doc = homepageDoc(context)
      if (!doc || !hasOversizedImages(doc)) return { findings: [] }

      const homepage = getHomepageSnapshot(context.pageSnapshots)?.page
      return {
        findings: [
          finding("mobile-oversized-images", {
            category: "performance",
            severity: "medium",
            scoreCategory: "mobile",
            title: "Images larger than viewport",
            description:
              "Large fixed-width images without responsive constraints were detected.",
            recommendation:
              "Serve responsive images with max-width: 100% and appropriate srcset sizes for mobile.",
            pageId: homepage?.id,
          }),
        ],
      }
    },
  },
]
