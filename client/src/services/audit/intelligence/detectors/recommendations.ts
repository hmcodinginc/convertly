import type { PageRuleContext, SiteRuleContext } from "@/services/audit/intelligence/types"
import { buildPageDetectorContext } from "@/services/audit/intelligence/detectors/context"

type RecContext = PageRuleContext | SiteRuleContext

function pagePath(context: RecContext): string {
  if ("currentSnapshot" in context) {
    return context.currentSnapshot.page.path
  }
  return "/"
}

function domain(context: RecContext): string {
  try {
    return new URL(context.session.websiteUrl).hostname
  } catch {
    return context.session.websiteUrl
  }
}

export const RULE_RECOMMENDATIONS: Record<string, (context: RecContext) => string> = {
  "tech-missing-viewport": (c) =>
    `Add a mobile viewport meta tag to the global layout on ${domain(c)} so pages scale correctly on phones and tablets.`,

  "tech-horizontal-overflow": (c) =>
    `Audit wide sections on ${pagePath(c)} and constrain containers with max-width: 100% to prevent horizontal scrolling on mobile.`,

  "tech-oversized-images": (c) =>
    `Serve responsive images on ${pagePath(c)} with max-width: 100% and appropriate srcset sizes to improve mobile load and layout stability.`,

  "tech-thin-content": (c) =>
    `Expand ${pagePath(c)} with a clear summary, supporting sections, and at least one outcome-focused paragraph so visitors understand the page purpose within seconds.`,

  "tech-missing-h1": (c) =>
    `Add a single descriptive H1 on ${pagePath(c)} that states the page topic and the value visitors should expect.`,

  "tech-weak-heading-structure": (c) =>
    `Break ${pagePath(c)} into scannable H2 sections (problem, approach, proof, next step) so visitors can skim and still grasp the offer.`,

  "tech-missing-meta-description": (c) =>
    `Write a unique meta description for ${pagePath(c)} that summarizes the offer in 140–160 characters and includes a reason to click from search results.`,

  "tech-missing-page-title": (c) =>
    `Set a descriptive document title for ${pagePath(c)} that includes the brand and the specific page intent.`,

  "tech-heavy-dom": (c) =>
    `Reduce unnecessary wrapper markup on ${pagePath(c)} and defer non-critical components to improve render performance on mobile.`,

  "a11y-small-touch-targets": (c) =>
    `Increase tap target padding on primary buttons and links on ${pagePath(c)} to at least 44×44px for mobile usability.`,

  "a11y-small-font-sizes": (c) =>
    `Keep body copy at 16px or larger on ${pagePath(c)} and avoid dense text blocks that are hard to read on small screens.`,

  "a11y-missing-landmarks": (c) =>
    `Add semantic navigation and footer landmarks on ${pagePath(c)} so visitors and assistive technology can orient quickly.`,

  "hero-missing-primary-cta": (c) =>
    `Add one primary call-to-action above the fold on ${pagePath(c)} that names the next business step (for example: book a discovery call or view case studies).`,

  "hero-multiple-competing-ctas": (c) =>
    `Reduce hero actions on ${pagePath(c)} to one primary CTA and at most one secondary action so visitors know the best next step.`,

  "hero-cta-below-fold": (c) =>
    `Move the primary CTA on ${pagePath(c)} into the first viewport on desktop and mobile so visitors do not need to hunt for it.`,

  "hero-generic-headline": (c) =>
    `Rewrite the homepage headline to state who you help and the measurable outcome they should expect within one sentence.`,

  "hero-no-value-proposition": (c) =>
    `Add a concise value proposition beneath the headline on ${pagePath(c)} explaining the business outcome in plain language.`,

  "conversion-weak-cta-language": (c) =>
    `Replace low-intent CTA copy on ${pagePath(c)} with outcome-oriented language that states what happens after the click.`,

  "conversion-too-many-nav-links": (c) =>
    `Consolidate header navigation on ${pagePath(c)} into fewer high-intent destinations and move secondary links to the footer.`,

  "conversion-no-urgency": (c) =>
    `Test an ethical urgency cue near the primary CTA on ${pagePath(c)}, such as limited onboarding slots or a timely offer.`,

  "conversion-no-lead-capture": (c) =>
    `Introduce a lightweight lead capture option on ${pagePath(c)} tied to a clear incentive, such as a strategy call or downloadable guide.`,

  "trust-no-testimonials": (c) =>
    `Add two or three client quotes or outcome snippets near the conversion path on ${pagePath(c)} to reduce hesitation.`,

  "trust-no-social-proof": (c) =>
    `Add recognizable proof on ${pagePath(c)}—client logos, review ratings, or outcome stats—adjacent to the primary CTA.`,

  "services-thin-page": (c) =>
    `Expand ${pagePath(c)} with who the service is for, what is delivered, and the business outcome clients should expect.`,

  "services-missing-cta": (c) =>
    `Add a service-specific CTA on ${pagePath(c)} (for example: request a quote or book a scoping call) after the value explanation.`,

  "services-unclear-offering": (c) =>
    `Clarify the service scope on ${pagePath(c)} with a strong H1, 2–3 H2 sections, and a plain-language summary of deliverables.`,

  "services-few-internal-links": (c) =>
    `Link from ${pagePath(c)} to related case studies, pricing, and contact pages to keep qualified visitors moving through the funnel.`,

  "services-no-proof": (c) =>
    `Add proof on ${pagePath(c)}—client outcomes, logos, or a short case result—to support the service promise.`,

  "services-missing-benefits": (c) =>
    `Add a benefits section on ${pagePath(c)} that translates features into client outcomes and time saved.`,

  "services-shallow-explanation": (c) =>
    `Deepen ${pagePath(c)} with process steps, deliverables, and timeline so prospects understand what working together looks like.`,

  "about-thin-story": (c) =>
    `Tell a fuller company story on ${pagePath(c)}: why the business exists, who it serves, and what makes the approach credible.`,

  "about-missing-mission": (c) =>
    `Add a mission statement on ${pagePath(c)} that explains the problem you solve and the standard you hold yourselves to.`,

  "about-no-credibility": (c) =>
    `Strengthen ${pagePath(c)} with team credentials, client outcomes, or years-in-business proof to build trust before the contact ask.`,

  "about-missing-contact-path": (c) =>
    `Add a visible contact CTA on ${pagePath(c)} so visitors who connect with your story can take the next step immediately.`,

  "about-missing-team": (c) =>
    `Introduce the people behind the business on ${pagePath(c)} with names, roles, or founder context to humanize the brand.`,

  "contact-no-form": (c) =>
    `Add a contact form on ${pagePath(c)} with name, email, and message fields so prospects can reach you without leaving the site.`,

  "contact-missing-email-path": (c) =>
    `Publish a direct email path on ${pagePath(c)} (mailto link or visible address) for visitors who prefer email over forms.`,

  "contact-single-touchpoint": (c) =>
    `Offer at least two contact methods on ${pagePath(c)}—for example form plus email or phone—so visitors can choose their preferred channel.`,

  "contact-missing-cta": (c) =>
    `Add a prominent submit or schedule CTA on ${pagePath(c)} with copy that states what happens after they reach out.`,

  "contact-thin-page": (c) =>
    `Add context on ${pagePath(c)} about response time, what information to include, and what the next step after inquiry looks like.`,

  "contact-missing-business-info": (c) =>
    `Include business contact details on ${pagePath(c)}—email, phone, or location—to reinforce legitimacy and reduce friction.`,

  "projects-thin-case-study": (c) =>
    `Expand ${pagePath(c)} with client context, challenge, approach, and measurable results so the work reads like a credible case study.`,

  "projects-missing-outcomes": (c) =>
    `Add explicit outcomes on ${pagePath(c)} (metrics, timelines, or before/after results) to demonstrate impact.`,

  "projects-missing-cta": (c) =>
    `Add a portfolio CTA on ${pagePath(c)} inviting visitors to discuss a similar project or view related work.`,

  "projects-low-supporting-copy": (c) =>
    `Structure ${pagePath(c)} with section headings for challenge, solution, and results so the narrative is easy to scan.`,

  "projects-missing-structure": (c) =>
    `Use a clear H1 and H2 structure on ${pagePath(c)} to separate project overview, approach, and outcomes.`,

  "pricing-thin-page": (c) =>
    `Clarify what is included on ${pagePath(c)} with plan summaries, ideal customer fit, and what happens after purchase.`,

  "pricing-missing-cta": (c) =>
    `Add a plan-level CTA on ${pagePath(c)} (start trial, book demo, or get quote) beside each pricing tier.`,

  "pricing-unclear-plans": (c) =>
    `Label pricing tiers on ${pagePath(c)} with plan names, inclusions, and a recommended option to reduce comparison friction.`,

  "pricing-missing-trust": (c) =>
    `Place testimonials, guarantees, or security notes near pricing on ${pagePath(c)} to reduce purchase anxiety.`,

  "blog-thin-article": (c) =>
    `Expand the article on ${pagePath(c)} with actionable detail, examples, and a conclusion that ties back to your offer.`,

  "blog-missing-headings": (c) =>
    `Break ${pagePath(c)} into H2 sections so readers can scan subtopics and search engines can understand structure.`,

  "blog-weak-title": (c) =>
    `Rewrite the article title on ${pagePath(c)} to include the topic and the reader benefit in under 60 characters.`,

  "blog-low-readability": (c) =>
    `Improve scanability on ${pagePath(c)} with subheadings, shorter paragraphs, and bullet lists for key takeaways.`,

  "legal-thin-policy": (c) =>
    `Expand the policy on ${pagePath(c)} with clear sections covering data collection, usage, retention, and user rights.`,

  "legal-missing-headings": (c) =>
    `Organize ${pagePath(c)} with H2 sections (data collected, cookies, contact, updates) for readability and compliance clarity.`,

  "legal-missing-contact-reference": (c) =>
    `Add a contact method in ${pagePath(c)} for privacy or legal inquiries so users know how to exercise their rights.`,

  "features-thin-page": (c) =>
    `Expand ${pagePath(c)} with feature benefits, use cases, and a path to demo or signup.`,

  "features-missing-cta": (c) =>
    `Add a feature-page CTA on ${pagePath(c)} that connects product capabilities to a concrete next step.`,

  "signup-missing-form": (c) =>
    `Ensure ${pagePath(c)} exposes a signup form with email capture and a clear completion action.`,

  "signup-thin-page": (c) =>
    `Add supporting copy on ${pagePath(c)} explaining what users get immediately after signing up.`,

  "login-missing-form": (c) =>
    `Ensure ${pagePath(c)} includes a login form with clear fields and a recovery path for forgotten credentials.`,

  "trust-missing-contact-page": (c) =>
    `Publish a dedicated contact page on ${domain(c)} and link it from the main navigation and footer.`,

  "trust-missing-privacy-policy": (c) =>
    `Add a privacy policy on ${domain(c)} and link it from the footer, especially if you collect emails or personal data.`,

  "trust-missing-terms-page": (c) =>
    `Publish terms of service on ${domain(c)} and link them from the footer for commercial trust and compliance.`,

  "site-footer-missing-legal": (c) =>
    `Add privacy and terms links to the global footer on ${domain(c)} so legal pages are discoverable from every page.`,

  "site-inconsistent-navigation": (c) =>
    `Standardize header navigation across ${domain(c)} so core destinations appear consistently on every rendered page.`,

  "site-weak-internal-linking": (c) =>
    `Strengthen internal links on ${domain(c)} between services, work, about, and contact pages to guide visitors through the funnel.`,

  "site-missing-about-link": (c) =>
    `Add an About page on ${domain(c)} and link it from the main navigation to build credibility before conversion.`,

  "site-missing-services-link": (c) =>
    `Ensure services or solutions are discoverable from the main navigation on ${domain(c)}.`,
}

export function getRuleRecommendation(ruleId: string, context: RecContext): string {
  return RULE_RECOMMENDATIONS[ruleId]?.(context) ?? "Review this page and address the identified conversion barrier."
}

export function formatFindingDescription(
  ruleId: string,
  context: RecContext,
  evidence: Array<{ label: string; value: string }>
): string {
  const pageCtx = "currentSnapshot" in context ? buildPageDetectorContext(context) : null
  const path = pageCtx?.pagePath ?? pagePath(context)
  const summary = evidence.map((item) => `${item.label}: ${item.value}`).join(". ")
  return `On ${path}, ${summary || "conversion signals did not meet the expected threshold."}`
}
