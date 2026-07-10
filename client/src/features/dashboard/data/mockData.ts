import type { Audit, Recommendation } from "@/types/audit"
import type { DashboardMetric, OpportunityItem } from "@/types/dashboard"

export type { Audit, Recommendation, DashboardMetric, OpportunityItem }

/** @deprecated Use Audit */
export type RecentAudit = Audit

/** @deprecated Use Recommendation */
export type AiRecommendation = Recommendation

export const dashboardMetrics: DashboardMetric[] = [
  {
    id: "conversion-score",
    label: "Conversion score",
    value: "72",
    change: "+6.4%",
    trend: "up",
    hint: "Weighted across audited journeys",
  },
  {
    id: "revenue-opportunity",
    label: "Revenue opportunity",
    value: "$48.2k",
    change: "+$12.1k",
    trend: "up",
    hint: "Modeled monthly uplift from open fixes",
  },
  {
    id: "open-opportunities",
    label: "Open opportunities",
    value: "23",
    change: "-4",
    trend: "down",
    hint: "Issues awaiting implementation",
  },
  {
    id: "pages-monitored",
    label: "Pages monitored",
    value: "186",
    change: "+14",
    trend: "up",
    hint: "Active URLs in current workspace",
  },
]

export const opportunityQueue: OpportunityItem[] = [
  {
    id: "opp-1",
    page: "/pricing",
    issue: "Primary CTA contrast fails WCAG AA on mobile",
    impact: "High",
    score: 91,
    status: "Open",
  },
  {
    id: "opp-2",
    page: "/signup",
    issue: "Form has 9 fields before value proposition",
    impact: "High",
    score: 88,
    status: "In review",
  },
  {
    id: "opp-3",
    page: "/product",
    issue: "Hero lacks social proof above the fold",
    impact: "Medium",
    score: 74,
    status: "Open",
  },
  {
    id: "opp-4",
    page: "/checkout",
    issue: "Guest checkout path hidden behind account modal",
    impact: "High",
    score: 86,
    status: "Queued",
  },
  {
    id: "opp-5",
    page: "/blog/guides",
    issue: "Inline CTAs missing on long-form content",
    impact: "Low",
    score: 62,
    status: "Open",
  },
]

export const aiRecommendations: Recommendation[] = [
  {
    id: "rec-1",
    ruleId: "signup-missing-form",
    title: "Reduce signup friction on mobile",
    summary:
      "Collapse optional fields and move SSO above email to recover an estimated 11% of abandoned sessions.",
    priority: "Critical",
    estimatedLift: "+11.2% signups",
    category: "Form optimization",
  },
  {
    id: "rec-2",
    ruleId: "pricing-unclear-plans",
    title: "Add pricing anchor on annual plan",
    summary:
      "Display monthly equivalent and savings badge on the annual tier to improve plan comparison clarity.",
    priority: "High",
    estimatedLift: "+4.8% ARPA",
    category: "Pricing",
  },
  {
    id: "rec-3",
    ruleId: "pricing-missing-trust",
    title: "Reposition trust signals on checkout",
    summary:
      "Move security badges and refund policy adjacent to payment CTA to reduce hesitation at decision point.",
    priority: "High",
    estimatedLift: "+3.1% checkout",
    category: "Trust & safety",
  },
  {
    id: "rec-4",
    ruleId: "features-missing-cta",
    title: "Introduce sticky secondary CTA on product",
    summary:
      "Persistent demo request button after scroll improves discovery for evaluation-stage visitors.",
    priority: "Medium",
    estimatedLift: "+2.4% demo requests",
    category: "Navigation",
  },
]

export const recentAudits: Audit[] = [
  {
    id: "audit-1",
    name: "Q2 Growth funnel",
    domain: "acme.io",
    completedAt: "May 28, 2026",
    pagesScanned: 42,
    conversionScore: 78,
    status: "Completed",
  },
  {
    id: "audit-2",
    name: "Mobile checkout pass",
    domain: "acme.io",
    completedAt: "May 26, 2026",
    pagesScanned: 18,
    conversionScore: 64,
    status: "Completed",
  },
  {
    id: "audit-3",
    name: "Enterprise landing refresh",
    domain: "acme.io/enterprise",
    completedAt: "May 24, 2026",
    pagesScanned: 12,
    conversionScore: 71,
    status: "Completed",
  },
  {
    id: "audit-4",
    name: "Weekly monitor",
    domain: "acme.io",
    completedAt: "May 29, 2026 · 09:00",
    pagesScanned: 186,
    conversionScore: 72,
    status: "Running",
  },
]
