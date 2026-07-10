import { INTELLIGENCE_CATEGORY_LABELS } from "@/services/audit/intelligence/categories"
import { getRuleMetadata, RULE_METADATA } from "@/services/audit/intelligence/rules/ruleMetadata"
import type { RuleDifficulty } from "@/services/audit/intelligence/types"
import type { RecommendationPriority } from "@/types/audit"
import type { FindingSeverity } from "@/types/auditEngine"

export type PlaybookCodeExample = {
  language: string
  code: string
  caption?: string
}

export type RulePlaybookSeed = {
  problem: string
  whyItMatters: string
  whyHappened?: string
  userImpact?: string
  businessImpact: string
  technicalExplanation: string
  priorityReason?: string
  implementation: string
  implementationSteps: string[]
  exampleCode?: PlaybookCodeExample
  difficulty: RuleDifficulty
  estimatedMinutes: number
  expectedImprovement: string
  relatedRuleIds?: string[]
}

const CATEGORY_WHY: Record<string, string> = {
  conversion:
    "Conversion paths depend on clear calls-to-action and frictionless next steps. Visitors who hesitate here rarely return.",
  trust:
    "Trust signals reduce hesitation before signup, purchase, or contact — especially at high-intent moments.",
  ux: "UX clarity helps visitors understand what to do next. Confusion here increases bounce and support load.",
  technical:
    "Technical foundations affect rendering reliability, SEO crawlability, and mobile usability across the funnel.",
  accessibility:
    "Accessible pages work for more visitors, improve mobile tap targets, and reduce usability friction.",
  performance:
    "Performance directly affects bounce rate, mobile engagement, and perceived product quality.",
  copy: "Copy clarity determines whether visitors understand your offer within the first few seconds.",
}

const BUSINESS_IMPACT_BY_LEVEL: Record<string, string> = {
  high: "Direct revenue risk — qualified visitors may abandon before converting.",
  medium: "Compounding friction — slows funnel velocity and lowers experiment win rate.",
  low: "Incremental drag — small leaks that add up across high-traffic pages.",
}

const DIFFICULTY_BY_SEVERITY: Record<FindingSeverity, RuleDifficulty> = {
  critical: "medium",
  high: "medium",
  medium: "low",
  low: "low",
}

const TIME_BY_DIFFICULTY: Record<RuleDifficulty, [number, number]> = {
  low: [20, 45],
  medium: [60, 180],
  high: [240, 480],
}

const IMPROVEMENT_BY_SEVERITY: Record<FindingSeverity, string> = {
  critical: "+8–15% conversion recovery on affected pages",
  high: "+4–10% lift on primary conversion actions",
  medium: "+2–6% improvement in engagement or completion",
  low: "+1–3% incremental gain; best as part of a bundle",
}

const CODE_EXAMPLES: Partial<Record<string, PlaybookCodeExample>> = {
  "tech-missing-viewport": {
    language: "html",
    caption: "Add to your global layout <head>",
    code: `<meta name="viewport" content="width=device-width, initial-scale=1" />`,
  },
  "tech-missing-meta-description": {
    language: "html",
    caption: "Unique meta description per page",
    code: `<meta
  name="description"
  content="Book a discovery call — we help B2B teams increase demo-to-close rate in 90 days."
/>`,
  },
  "tech-missing-page-title": {
    language: "html",
    caption: "Descriptive document title",
    code: `<title>Convertly — Conversion audits for SaaS teams</title>`,
  },
  "tech-horizontal-overflow": {
    language: "css",
    caption: "Prevent horizontal scroll on mobile",
    code: `.page-shell {
  max-width: 100%;
  overflow-x: hidden;
}

img, video, iframe {
  max-width: 100%;
  height: auto;
}`,
  },
  "a11y-small-touch-targets": {
    language: "css",
    caption: "Minimum 44×44px tap targets",
    code: `.btn-primary {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 20px;
}`,
  },
  "hero-missing-primary-cta": {
    language: "tsx",
    caption: "Single primary CTA above the fold",
    code: `<section className="hero">
  <h1>Turn traffic into qualified pipeline</h1>
  <p>Audit your funnel in minutes — no code required.</p>
  <Button size="lg">Book a discovery call</Button>
</section>`,
  },
  "hero-multiple-competing-ctas": {
    language: "tsx",
    caption: "One primary + optional secondary",
    code: `<div className="hero-actions">
  <Button variant="default">Start free audit</Button>
  <Button variant="ghost">View sample report</Button>
</div>`,
  },
  "conversion-weak-cta-language": {
    language: "tsx",
    caption: "Outcome-oriented CTA copy",
    code: `// Before: "Submit"
// After:
<Button>Get my conversion report</Button>`,
  },
  "pricing-unclear-plans": {
    language: "tsx",
    caption: "Scannable plan cards with a recommended tier",
    code: `<PlanCard
  name="Growth"
  price="$149/mo"
  badge="Most popular"
  features={["Unlimited audits", "Team seats", "Priority support"]}
  cta="Start 14-day trial"
/>`,
  },
  "pricing-missing-trust": {
    language: "tsx",
    caption: "Trust row adjacent to pricing CTAs",
    code: `<div className="pricing-trust">
  <ShieldIcon aria-hidden />
  <span>14-day refund · SOC 2 in progress · Cancel anytime</span>
</div>`,
  },
  "signup-missing-form": {
    language: "tsx",
    caption: "Minimal first-step signup",
    code: `<form onSubmit={onSubmit}>
  <Input type="email" label="Work email" required />
  <Input type="password" label="Password" required />
  <Button type="submit">Create account</Button>
</form>`,
  },
  "contact-no-form": {
    language: "tsx",
    caption: "High-intent contact form",
    code: `<form>
  <Input name="name" label="Name" required />
  <Input name="email" type="email" label="Email" required />
  <Textarea name="message" label="How can we help?" />
  <Button type="submit">Send message</Button>
</form>`,
  },
  "site-footer-missing-legal": {
    language: "tsx",
    caption: "Footer legal links on every page",
    code: `<footer>
  <nav aria-label="Legal">
    <Link to="/privacy">Privacy</Link>
    <Link to="/terms">Terms</Link>
  </nav>
</footer>`,
  },
  "features-missing-cta": {
    language: "tsx",
    caption: "Sticky secondary CTA after scroll",
    code: `const showSticky = useScrollPast(400)

return showSticky ? (
  <div className="sticky-cta">
    <Button>Request demo</Button>
  </div>
) : null`,
  },
}

const RULE_PROBLEM_OVERRIDES: Partial<Record<string, string>> = {
  "hero-missing-primary-cta":
    "The hero section does not expose a single, obvious primary action above the fold.",
  "hero-multiple-competing-ctas":
    "Multiple buttons compete for attention in the hero, splitting visitor intent.",
  "signup-missing-form":
    "The signup page lacks a visible capture form, blocking account creation entirely.",
  "pricing-unclear-plans":
    "Pricing tiers lack clear labels, inclusions, and a recommended option.",
  "pricing-missing-trust":
    "Trust signals are absent near pricing CTAs where purchase anxiety peaks.",
  "tech-missing-viewport":
    "The page is missing a mobile viewport meta tag, causing layout scaling issues on phones.",
  "contact-no-form":
    "High-intent visitors cannot submit an inquiry without leaving the site.",
}

const RULE_IMPLEMENTATION_OVERRIDES: Partial<Record<string, string>> = {
  "hero-missing-primary-cta":
    "Add one primary CTA above the fold that names the business outcome (demo, trial, or quote).",
  "hero-multiple-competing-ctas":
    "Demote secondary actions to ghost/outline style and keep one filled primary button.",
  "signup-missing-form":
    "Ship email + password on step one; defer optional fields until after account creation.",
  "pricing-unclear-plans":
    "Label each tier, list inclusions, and highlight one recommended plan with a badge.",
  "pricing-missing-trust":
    "Place refund policy, security note, or testimonial within one viewport of the pay CTA.",
  "tech-missing-viewport":
    "Add the viewport meta tag to your root HTML layout template.",
  "features-missing-cta":
    "Add a persistent secondary CTA that appears after ~400px scroll on long product pages.",
}

function formatPath(paths: string[]): string {
  if (paths.length === 0) return "the affected page"
  if (paths.length === 1) return paths[0]!
  return `${paths[0]} (+${paths.length - 1} more)`
}

function buildSteps(
  ruleId: string,
  title: string,
  pathLabel: string,
  implementation: string
): string[] {
  const specific = STEP_OVERRIDES[ruleId]
  if (specific) return specific.map((step) => step.replace("{path}", pathLabel))

  return [
    `Audit ${pathLabel} and confirm "${title}" in production and staging.`,
    implementation,
    "Ship behind a feature flag or segment if traffic is high-risk.",
    "Validate on mobile and desktop — capture before/after screenshots.",
    "Re-run a Convertly audit after deploy to confirm the signal cleared.",
  ]
}

const STEP_OVERRIDES: Partial<Record<string, string[]>> = {
  "hero-missing-primary-cta": [
    "Screenshot {path} above the fold on mobile and desktop.",
    "Add one primary button with outcome copy (e.g. “Book a demo”).",
    "Ensure contrast ratio ≥ 4.5:1 and min 44px tap height.",
    "Remove or demote competing hero links to footer/secondary style.",
    "Measure CTR on the primary CTA for 14 days post-launch.",
  ],
  "signup-missing-form": [
    "Reduce step-one fields to email, password, and submit on {path}.",
    "Move Google/Microsoft SSO above the email field with equal weight.",
    "Collapse company/role fields into an optional post-signup step.",
    "Add inline validation and a clear post-submit confirmation state.",
    "A/B test mobile signup completion for two weeks.",
  ],
  "pricing-unclear-plans": [
    "Add plan name, price, and 3–5 bullet inclusions per tier on {path}.",
    "Show monthly equivalent under annual pricing (e.g. “$X/mo billed annually”).",
    "Badge one tier as “Recommended” or “Most popular”.",
    "Keep monthly as default selection for first-time visitors.",
    "Track plan selection rate and ARPA for 30 days.",
  ],
  "pricing-missing-trust": [
    "Move SSL/partner badges within 24px of the payment CTA on {path}.",
    "Add one-line refund policy visible without scrolling on mobile.",
    "Place a short testimonial or rating near the checkout button.",
    "Test checkout completion segmented by new vs returning users.",
  ],
  "tech-missing-viewport": [
    "Add viewport meta to the global layout used by {path}.",
    "Test on iOS Safari and Android Chrome at 375px width.",
    "Confirm no horizontal overflow after the change.",
    "Re-run Lighthouse mobile audit to verify scaling.",
  ],
  "features-missing-cta": [
    "Implement sticky CTA bar with backdrop blur matching existing nav.",
    "Show after 400px scroll on {path}; hide when in-page form is visible.",
    "Use outcome copy: “Request demo” or “Talk to sales”.",
    "Measure demo request rate from organic product traffic.",
  ],
}

function buildPriorityReason(meta: NonNullable<ReturnType<typeof getRuleMetadata>>): string {
  const severityLabel =
    meta.severity === "critical"
      ? "Critical severity"
      : meta.severity === "high"
        ? "High severity"
        : meta.severity === "medium"
          ? "Medium severity"
          : "Lower severity"
  return `${severityLabel} on ${meta.scoreCategory} scoring with ${meta.businessImpact} business impact — weighted ${meta.weight.toFixed(2)} in the audit engine.`
}

function buildWhyHappened(ruleId: string, title: string, category: string): string {
  const overrides: Partial<Record<string, string>> = {
    "hero-missing-primary-cta":
      "Hero sections are often designed for brand aesthetics first, with CTAs deferred to lower sections or buried in navigation.",
    "signup-missing-form":
      "Signup flows are sometimes split across modals, third-party widgets, or delayed JavaScript hydration that the audit snapshot missed.",
    "tech-missing-viewport":
      "Legacy templates or CMS themes sometimes ship without mobile viewport tags, especially on custom landing pages.",
    "pricing-unclear-plans":
      "Pricing pages evolve incrementally — tiers get renamed or bundled without updating comparison copy.",
  }
  return (
    overrides[ruleId] ??
    `This pattern usually appears when ${category.toLowerCase()} requirements were deprioritized during a fast launch or template reuse. "${title}" is a common gap on sites that have not been through a structured CRO review.`
  )
}

function buildUserImpact(category: string, pathLabel: string): string {
  const byCategory: Partial<Record<string, string>> = {
    conversion: `Visitors on ${pathLabel} hesitate at the decision point — they may scroll, bounce, or choose a competitor with a clearer next step.`,
    trust: `First-time visitors on ${pathLabel} lack reassurance signals and may delay signup, purchase, or contact until they find proof elsewhere.`,
    ux: `Users on ${pathLabel} spend extra cognitive effort understanding the page, increasing bounce on mobile and shortening session depth.`,
    accessibility: `Mobile and assistive-technology users on ${pathLabel} face friction that desktop-only QA often misses.`,
    performance: `Slow or heavy ${pathLabel} increases bounce on mobile networks and reduces engagement before the value proposition lands.`,
    technical: `Search engines and mobile browsers may render ${pathLabel} incorrectly, reducing discoverability and usability.`,
    copy: `Visitors skim ${pathLabel} without grasping the offer, so even strong products fail the five-second comprehension test.`,
  }
  return byCategory[category] ?? `Visitors on ${pathLabel} experience unnecessary friction that compounds across the funnel.`
}

function findRelatedRuleIds(ruleId: string, tags: string[], limit = 3): string[] {
  const meta = getRuleMetadata(ruleId)
  if (!meta) return []

  return RULE_METADATA.filter(
    (entry) =>
      entry.id !== ruleId &&
      (entry.category === meta.category ||
        entry.scoreCategory === meta.scoreCategory ||
        entry.tags.some((tag) => tags.includes(tag)))
  )
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map((entry) => entry.id)
}

function buildTechnicalExplanation(
  ruleId: string,
  title: string,
  category: string,
  scope: string,
  tags: string[]
): string {
  const scopeLabel = scope === "site" ? "site-wide" : "page-level"
  const tagHint = tags.length > 0 ? ` Signals: ${tags.join(", ")}.` : ""
  return `Rule \`${ruleId}\` (${scopeLabel}, ${category}) flagged "${title}". Convertly detected missing or weak patterns during rendered DOM analysis.${tagHint}`
}

function buildRulePlaybookSeed(
  ruleId: string,
  affectedPaths: string[] = []
): RulePlaybookSeed | null {
  const meta = getRuleMetadata(ruleId)
  if (!meta) return null

  const pathLabel = formatPath(affectedPaths)
  const category =
    INTELLIGENCE_CATEGORY_LABELS[meta.category as keyof typeof INTELLIGENCE_CATEGORY_LABELS] ??
    meta.category
  const difficulty = DIFFICULTY_BY_SEVERITY[meta.severity]
  const [minMin, maxMin] = TIME_BY_DIFFICULTY[difficulty]
  const estimatedMinutes = Math.round((minMin + maxMin) / 2)

  const problem =
    RULE_PROBLEM_OVERRIDES[ruleId] ??
    `${meta.title} was detected on ${pathLabel}. This creates measurable friction in your conversion funnel.`

  const implementation =
    RULE_IMPLEMENTATION_OVERRIDES[ruleId] ??
    `Address "${meta.title}" on ${pathLabel} using the checklist below.`

  return {
    problem,
    whyItMatters:
      CATEGORY_WHY[meta.category] ??
      "This issue affects how visitors perceive and interact with your site.",
    whyHappened: buildWhyHappened(ruleId, meta.title, category),
    userImpact: buildUserImpact(meta.category, pathLabel),
    businessImpact: BUSINESS_IMPACT_BY_LEVEL[meta.businessImpact] ?? BUSINESS_IMPACT_BY_LEVEL.medium!,
    technicalExplanation: buildTechnicalExplanation(
      ruleId,
      meta.title,
      category,
      meta.scope,
      meta.tags
    ),
    priorityReason: buildPriorityReason(meta),
    implementation,
    implementationSteps: buildSteps(ruleId, meta.title, pathLabel, implementation),
    exampleCode: CODE_EXAMPLES[ruleId],
    difficulty,
    estimatedMinutes,
    expectedImprovement: IMPROVEMENT_BY_SEVERITY[meta.severity],
    relatedRuleIds: findRelatedRuleIds(ruleId, meta.tags),
  }
}

function severityFromPriority(priority?: RecommendationPriority): FindingSeverity {
  if (priority === "Critical") return "critical"
  if (priority === "High") return "high"
  return "medium"
}

function buildSeedForRuleId(
  ruleId: string,
  affectedPaths: string[] = [],
  priority?: RecommendationPriority
): RulePlaybookSeed {
  const fromCatalog = buildRulePlaybookSeed(ruleId, affectedPaths)
  if (fromCatalog) return fromCatalog

  const fallbackSeverity = severityFromPriority(priority)
  return {
    problem: "A conversion friction point was identified on a high-traffic page.",
    whyItMatters: CATEGORY_WHY.conversion!,
    businessImpact: BUSINESS_IMPACT_BY_LEVEL.medium!,
    technicalExplanation: `Rule ${ruleId} triggered during audit analysis.`,
    implementation: "Apply the prioritized fix and validate with a controlled experiment.",
    implementationSteps: buildSteps(ruleId, "Conversion issue", formatPath(affectedPaths), "Apply the fix."),
    difficulty: DIFFICULTY_BY_SEVERITY[fallbackSeverity],
    estimatedMinutes: 90,
    expectedImprovement: IMPROVEMENT_BY_SEVERITY[fallbackSeverity],
  }
}

/** Demo recommendation IDs → intelligence rule IDs */
const DEMO_REC_TO_RULE: Record<string, string> = {
  "rec-1": "signup-missing-form",
  "rec-2": "pricing-unclear-plans",
  "rec-3": "pricing-missing-trust",
  "rec-4": "features-missing-cta",
}

const DEMO_PLAYBOOKS: Record<string, RulePlaybookSeed> = {
  "rec-1": {
    problem:
      "The signup flow presents nine fields—including optional company data—before users understand product value.",
    whyItMatters:
      "Every additional field increases abandonment. Mobile sessions show sharp drop-off between step one and email confirmation.",
    businessImpact:
      "Direct revenue risk — trial and paid signup velocity stalls when friction exceeds perceived value.",
    technicalExplanation:
      "Rule `signup-missing-form` (page-level, Conversion) flagged excessive visible fields and missing SSO prominence on the signup route.",
    implementation:
      "Collapse optional fields behind an expandable section and move Google and Microsoft SSO above the email field.",
    implementationSteps: STEP_OVERRIDES["signup-missing-form"]!.map((s) =>
      s.replace("{path}", "/signup")
    ),
    exampleCode: CODE_EXAMPLES["signup-missing-form"],
    difficulty: "medium",
    estimatedMinutes: 120,
    expectedImprovement: "+8–12% signup completion on mobile",
  },
  "rec-2": {
    problem:
      "Annual pricing lacks a monthly equivalent anchor, making plan comparison cognitively expensive.",
    whyItMatters:
      "Visitors hesitate when they cannot quickly compare effective monthly cost, especially on annual commitments.",
    businessImpact:
      "Compounding friction — slower plan selection reduces ARPA and lengthens sales cycles.",
    technicalExplanation:
      "Rule `pricing-unclear-plans` (page-level, UX) flagged missing plan labels, inclusions, and comparison anchors on /pricing.",
    implementation:
      "Display monthly equivalent pricing and a savings badge on the annual tier card.",
    implementationSteps: STEP_OVERRIDES["pricing-unclear-plans"]!.map((s) =>
      s.replace("{path}", "/pricing")
    ),
    exampleCode: CODE_EXAMPLES["pricing-unclear-plans"],
    difficulty: "low",
    estimatedMinutes: 45,
    expectedImprovement: "+4–8% ARPA on annual plan selection",
  },
  "rec-3": {
    problem:
      "Trust signals (security badges, refund policy) are separated from the payment CTA on checkout.",
    whyItMatters:
      "Hesitation at payment is the highest-intent moment to reinforce security and refund confidence.",
    businessImpact:
      "Direct revenue risk — checkout abandonment at the payment step is among the costliest leaks.",
    technicalExplanation:
      "Rule `pricing-missing-trust` (page-level, Trust) flagged trust elements outside the payment CTA viewport.",
    implementation:
      "Place trust badges and refund copy directly adjacent to the primary payment button.",
    implementationSteps: STEP_OVERRIDES["pricing-missing-trust"]!.map((s) =>
      s.replace("{path}", "/checkout")
    ),
    exampleCode: CODE_EXAMPLES["pricing-missing-trust"],
    difficulty: "low",
    estimatedMinutes: 35,
    expectedImprovement: "+3–6% checkout completion",
  },
  "rec-4": {
    problem:
      "Evaluation-stage visitors lose the demo CTA after scrolling past the hero on product pages.",
    whyItMatters:
      "Long product pages without persistent CTAs reduce discovery of the highest-converting action.",
    businessImpact:
      "Incremental drag on pipeline — demo requests from organic product traffic underperform.",
    technicalExplanation:
      "Rule `features-missing-cta` (page-level, Conversion) flagged no persistent secondary action after initial viewport.",
    implementation:
      "Add a sticky secondary “Request demo” button that appears after 400px scroll.",
    implementationSteps: STEP_OVERRIDES["features-missing-cta"]!.map((s) =>
      s.replace("{path}", "/product")
    ),
    exampleCode: CODE_EXAMPLES["features-missing-cta"],
    difficulty: "medium",
    estimatedMinutes: 90,
    expectedImprovement: "+2–5% demo requests from product pages",
  },
}

function parseRuleIdFromRecommendationId(recommendationId: string): string | undefined {
  if (DEMO_REC_TO_RULE[recommendationId]) {
    return DEMO_REC_TO_RULE[recommendationId]
  }

  if (recommendationId.startsWith("consultant-")) {
    const parts = recommendationId.slice("consultant-".length).split("-")
    const indexPart = parts[parts.length - 1]
    if (!indexPart || !/^\d+$/.test(indexPart) || parts.length < 3) {
      return undefined
    }
    return parts.slice(0, -2).join("-")
  }

  return undefined
}

function priorityLabelFromSeverity(severity: FindingSeverity): RecommendationPriority {
  if (severity === "critical") return "Critical"
  if (severity === "high") return "High"
  return "Medium"
}

export {
  DEMO_PLAYBOOKS,
  DEMO_REC_TO_RULE,
  buildRulePlaybookSeed,
  buildSeedForRuleId,
  parseRuleIdFromRecommendationId,
  priorityLabelFromSeverity,
  RULE_METADATA,
}
