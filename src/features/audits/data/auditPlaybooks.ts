import type { RecommendationPlaybook } from "@/types/audit"

const playbookMap: Record<string, RecommendationPlaybook> = {
  "rec-1": {
    recommendationId: "rec-1",
    problem:
      "The signup flow presents nine fields—including optional company data—before users understand the product value.",
    whyItMatters:
      "Every additional field increases abandonment. Mobile sessions show a 34% drop-off between step one and email confirmation.",
    recommendation:
      "Collapse optional fields behind an expandable section and move Google and Microsoft SSO above the email field.",
    estimatedLift: "+11.2% signups",
    implementationSteps: [
      "Reduce visible fields to email, password, and primary CTA on step one.",
      "Add SSO buttons with equal visual weight to the email submit action.",
      "Defer company size and role questions until after account creation.",
      "Run a 2-week A/B test on mobile traffic before full rollout.",
    ],
  },
  "rec-2": {
    recommendationId: "rec-2",
    problem:
      "Annual pricing lacks a monthly equivalent anchor, making plan comparison cognitively expensive.",
    whyItMatters:
      "Visitors hesitate when they cannot quickly compare effective monthly cost, especially on annual commitments.",
    recommendation:
      "Display monthly equivalent pricing and a savings badge on the annual tier card.",
    estimatedLift: "+4.8% ARPA",
    implementationSteps: [
      "Add “$X/mo billed annually” subtext under the annual price.",
      "Introduce a “Save 20%” badge on the recommended annual plan.",
      "Keep monthly plan as the default selection for first-time visitors.",
      "Track plan selection rate and ARPA for 30 days post-launch.",
    ],
  },
  "rec-3": {
    recommendationId: "rec-3",
    problem:
      "Trust signals (security badges, refund policy) are separated from the payment CTA on checkout.",
    whyItMatters:
      "Hesitation at the payment step is the highest-intent moment to reinforce security and refund confidence.",
    recommendation:
      "Place Norton-style trust badges and refund copy directly adjacent to the primary payment button.",
    estimatedLift: "+3.1% checkout",
    implementationSteps: [
      "Move SSL and payment-partner badges within 24px of the pay button.",
      "Add one-line refund policy link visible without scrolling on mobile.",
      "Test checkout completion rate segmented by new vs returning users.",
    ],
  },
  "rec-4": {
    recommendationId: "rec-4",
    problem:
      "Evaluation-stage visitors lose the demo CTA after scrolling past the hero on product pages.",
    whyItMatters:
      "Long product pages without persistent CTAs reduce discovery of the highest-converting action.",
    recommendation:
      "Add a sticky secondary “Request demo” button that appears after 400px scroll.",
    estimatedLift: "+2.4% demo requests",
    implementationSteps: [
      "Implement sticky CTA bar with subtle backdrop blur matching existing nav.",
      "Hide sticky CTA when the in-page demo form is in viewport.",
      "Measure demo request rate from organic product page traffic.",
    ],
  },
}

function getRecommendationPlaybook(recommendationId: string): RecommendationPlaybook {
  if (playbookMap[recommendationId]) {
    return playbookMap[recommendationId]
  }

  return {
    recommendationId,
    problem: "A conversion friction point was identified on a high-traffic page in your funnel.",
    whyItMatters:
      "Unresolved friction on key pages compounds into measurable revenue loss over time.",
    recommendation:
      "Apply the prioritized fix from your audit report and validate impact with a controlled experiment.",
    estimatedLift: "Varies by segment",
    implementationSteps: [
      "Review the linked issue in your opportunity queue.",
      "Assign an owner and target ship date within two sprints.",
      "Ship the change behind a feature flag when possible.",
      "Measure conversion lift for 14 days before calling the experiment.",
    ],
  }
}

export { getRecommendationPlaybook, playbookMap }
