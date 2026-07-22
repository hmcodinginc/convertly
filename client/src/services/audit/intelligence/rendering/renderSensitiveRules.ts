/**
 * Rules that require trustworthy rendered DOM (renderConfidence >= 0.85).
 * Below threshold: findings become "could not verify" — never scored or recommended.
 */
export const RENDER_SENSITIVE_RULE_IDS = new Set([
  "tech-missing-viewport",
  "tech-missing-h1",
  "tech-weak-heading-structure",
  "tech-missing-meta-description",
  "tech-missing-page-title",
  "hero-missing-primary-cta",
  "hero-no-value-proposition",
  "hero-generic-headline",
  "hero-cta-below-fold",
  "hero-multiple-competing-ctas",
  "conversion-weak-cta-language",
  "a11y-missing-landmarks",
  "conversion-no-lead-capture",
  "conversion-no-urgency",
  "trust-no-testimonials",
  "trust-no-social-proof",
  "login-missing-form",
  "signup-missing-form",
  "contact-no-form",
])

/** DOM structure rules — H1, viewport, meta, headings, landmarks */
export const DOM_DEPENDENT_RULE_IDS = new Set([
  "tech-missing-viewport",
  "tech-missing-h1",
  "tech-weak-heading-structure",
  "tech-missing-meta-description",
  "tech-missing-page-title",
  "a11y-missing-landmarks",
])

/** Hero / conversion placement rules */
export const HERO_ANALYSIS_RULE_IDS = new Set([
  "hero-missing-primary-cta",
  "hero-no-value-proposition",
  "hero-generic-headline",
  "hero-cta-below-fold",
  "hero-multiple-competing-ctas",
  "conversion-weak-cta-language",
])

/** Marketing conversion rules — suppressed on search/platform/low-confidence sites */
export const CONVERSION_DOM_RULE_IDS = new Set([
  "hero-missing-primary-cta",
  "hero-no-value-proposition",
  "hero-generic-headline",
  "hero-cta-below-fold",
  "hero-multiple-competing-ctas",
  "conversion-weak-cta-language",
  "conversion-no-lead-capture",
  "conversion-no-urgency",
  "trust-no-testimonials",
  "trust-no-social-proof",
  "login-missing-form",
  "signup-missing-form",
  "contact-no-form",
])

export const FORM_DETECTION_RULE_IDS = new Set([
  "login-missing-form",
  "signup-missing-form",
  "contact-no-form",
])

export function isRenderSensitiveRule(ruleId: string): boolean {
  return RENDER_SENSITIVE_RULE_IDS.has(ruleId)
}

export function isDomDependentRule(ruleId: string): boolean {
  return DOM_DEPENDENT_RULE_IDS.has(ruleId)
}

export function isConversionDomRule(ruleId: string): boolean {
  return CONVERSION_DOM_RULE_IDS.has(ruleId)
}

export function isFormDetectionRule(ruleId: string): boolean {
  return FORM_DETECTION_RULE_IDS.has(ruleId)
}
