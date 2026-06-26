import type {
  AuditDetail,
  PageFinding,
  Recommendation,
  ScoreBreakdownItem,
  TimelineEvent,
} from "@/types/audit"

export type {
  AuditDetail,
  Issue,
  PageFinding,
  Recommendation,
  RecommendationPlaybook,
  ScoreBreakdownItem,
  TimelineEvent,
} from "@/types/audit"

/** @deprecated Use Issue from @/types/audit */
export type ConversionIssue = import("@/types/audit").Issue

const baseRecommendations: Recommendation[] = [
  {
    id: "rec-1",
    title: "Reduce signup friction on mobile",
    summary:
      "Collapse optional fields and move SSO above email to recover an estimated 11% of abandoned sessions.",
    priority: "Critical",
    estimatedLift: "+11.2% signups",
    category: "Form optimization",
  },
  {
    id: "rec-2",
    title: "Add pricing anchor on annual plan",
    summary:
      "Display monthly equivalent and savings badge on the annual tier to improve plan comparison clarity.",
    priority: "High",
    estimatedLift: "+4.8% ARPA",
    category: "Pricing",
  },
  {
    id: "rec-3",
    title: "Reposition trust signals on checkout",
    summary:
      "Move security badges and refund policy adjacent to payment CTA to reduce hesitation at decision point.",
    priority: "High",
    estimatedLift: "+3.1% checkout",
    category: "Trust & safety",
  },
]

function scoreStatus(score: number): ScoreBreakdownItem["status"] {
  if (score >= 75) return "Strong"
  if (score >= 60) return "Needs work"
  return "Critical"
}

function buildScoreBreakdown(overall: number): ScoreBreakdownItem[] {
  const offsets = [-3, 2, -5, 4, -1]
  const trends: ScoreBreakdownItem["trend"][] = ["up", "up", "down", "up", "neutral"]
  const trendValues = ["+4", "+2", "-3", "+5", "0"]
  const labels: ScoreBreakdownItem["label"][] = [
    "Clarity",
    "Trust",
    "Friction",
    "Performance",
    "CTA Strength",
  ]

  return labels.map((label, i) => {
    const score = Math.min(99, Math.max(40, overall + offsets[i]!))
    return {
      id: label.toLowerCase().replace(/\s+/g, "-"),
      label,
      score,
      trend: trends[i]!,
      trendValue: trendValues[i]!,
      status: scoreStatus(score),
    }
  })
}

function buildPageFindings(overall: number): PageFinding[] {
  const pages: Omit<PageFinding, "status">[] = [
    { id: "home", label: "Homepage", path: "/", score: overall + 4, issuesCount: 2 },
    { id: "pricing", label: "Pricing", path: "/pricing", score: overall - 6, issuesCount: 4 },
    { id: "signup", label: "Signup", path: "/signup", score: overall - 12, issuesCount: 5 },
    { id: "checkout", label: "Checkout", path: "/checkout", score: overall - 8, issuesCount: 3 },
  ]

  return pages.map((page) => ({
    ...page,
    status:
      page.score >= 75 ? "Healthy" : page.score >= 60 ? "At risk" : ("Critical" as const),
  }))
}

function buildTimeline(completedAt: string): TimelineEvent[] {
  return [
    {
      id: "tl-1",
      label: "Audit started",
      timestamp: `${completedAt} · 08:42`,
      status: "completed",
    },
    {
      id: "tl-2",
      label: "Pages scanned",
      timestamp: `${completedAt} · 08:51`,
      status: "completed",
    },
    {
      id: "tl-3",
      label: "Analysis completed",
      timestamp: `${completedAt} · 09:04`,
      status: "completed",
    },
    {
      id: "tl-4",
      label: "Recommendations generated",
      timestamp: `${completedAt} · 09:06`,
      status: "completed",
    },
  ]
}

function enrichAuditDetail(partial: Omit<AuditDetail, "scoreBreakdown" | "pageFindings" | "timeline">): AuditDetail {
  return {
    ...partial,
    siteFindings: partial.siteFindings ?? [],
    scoreBreakdown: buildScoreBreakdown(partial.overallScore),
    pageFindings: buildPageFindings(partial.overallScore),
    timeline: buildTimeline(partial.completedAt.split("·")[0]?.trim() ?? partial.completedAt),
  }
}

const auditDetailsMap: Record<string, AuditDetail> = {
  "audit-1": enrichAuditDetail({
    id: "audit-1",
    name: "Q2 Growth funnel",
    domain: "acme.io",
    completedAt: "May 28, 2026",
    pagesAnalyzed: 42,
    overallScore: 78,
    previousScore: 72,
    scoreDelta: 6,
    status: "Completed",
    issues: [
      {
        id: "i-1",
        issue: "Pricing CTA below fold on mobile viewports",
        severity: "High",
        impact: "$8.4k/mo modeled uplift",
        page: "/pricing",
      },
      {
        id: "i-2",
        issue: "Signup form requests company size before email",
        severity: "Critical",
        impact: "11.2% signup recovery potential",
        page: "/signup",
      },
      {
        id: "i-3",
        issue: "Missing trust badges on checkout step 2",
        severity: "Medium",
        impact: "3.1% checkout lift",
        page: "/checkout",
      },
      {
        id: "i-4",
        issue: "Product hero lacks quantified social proof",
        severity: "Medium",
        impact: "2.4% demo request lift",
        page: "/",
      },
      {
        id: "i-4b",
        issue: "Homepage headline does not state outcome within 5 words",
        severity: "Low",
        impact: "Clarity score improvement",
        page: "/",
      },
    ],
    recommendations: baseRecommendations,
  }),
  "audit-2": enrichAuditDetail({
    id: "audit-2",
    name: "Mobile checkout pass",
    domain: "acme.io",
    completedAt: "May 26, 2026",
    pagesAnalyzed: 18,
    overallScore: 64,
    previousScore: 68,
    scoreDelta: -4,
    status: "Completed",
    issues: [
      {
        id: "i-5",
        issue: "Guest checkout buried behind account creation",
        severity: "Critical",
        impact: "14.6% cart recovery potential",
        page: "/checkout",
      },
      {
        id: "i-6",
        issue: "Payment errors lack inline recovery guidance",
        severity: "High",
        impact: "5.2% checkout completion lift",
        page: "/checkout",
      },
      {
        id: "i-7",
        issue: "Shipping estimator loads after address form",
        severity: "Medium",
        impact: "1.8% friction reduction",
        page: "/checkout",
      },
      {
        id: "i-7b",
        issue: "Pricing page missing mobile sticky CTA",
        severity: "Low",
        impact: "Minor engagement lift",
        page: "/pricing",
      },
    ],
    recommendations: baseRecommendations.slice(0, 2),
  }),
  "audit-3": enrichAuditDetail({
    id: "audit-3",
    name: "Enterprise landing refresh",
    domain: "acme.io/enterprise",
    completedAt: "May 24, 2026",
    pagesAnalyzed: 12,
    overallScore: 71,
    previousScore: 69,
    scoreDelta: 2,
    status: "Completed",
    issues: [
      {
        id: "i-8",
        issue: "Enterprise ROI calculator hidden in footer",
        severity: "High",
        impact: "6.1% SQL lift for enterprise segment",
        page: "/",
      },
      {
        id: "i-9",
        issue: "Case study logos lack industry labels",
        severity: "Low",
        impact: "Trust clarity improvement",
        page: "/",
      },
    ],
    recommendations: baseRecommendations.slice(1, 3),
  }),
  "audit-4": {
    ...enrichAuditDetail({
      id: "audit-4",
      name: "Weekly monitor",
      domain: "acme.io",
      completedAt: "May 29, 2026",
      pagesAnalyzed: 186,
      overallScore: 72,
      previousScore: 72,
      scoreDelta: 0,
      status: "Running",
      issues: [],
      recommendations: [],
    }),
    timeline: [
      {
        id: "tl-1",
        label: "Audit started",
        timestamp: "May 29, 2026 · 09:00",
        status: "completed",
      },
      {
        id: "tl-2",
        label: "Pages scanned",
        timestamp: "May 29, 2026 · 09:12",
        status: "completed",
      },
      {
        id: "tl-3",
        label: "Analysis completed",
        timestamp: "In progress",
        status: "in_progress",
      },
      {
        id: "tl-4",
        label: "Recommendations generated",
        timestamp: "Pending",
        status: "pending",
      },
    ],
  },
}

function buildAuditDetailFromAudit(
  id: string,
  name: string,
  domain: string
): AuditDetail {
  const completedAt = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return enrichAuditDetail({
    id,
    name,
    domain,
    completedAt,
    pagesAnalyzed: 24,
    overallScore: 68,
    previousScore: 64,
    scoreDelta: 4,
    status: "Completed",
    issues: [
      {
        id: `${id}-i-1`,
        issue: "Primary CTA contrast fails WCAG AA on mobile",
        severity: "High",
        impact: "$4.2k/mo modeled uplift",
        page: "/",
      },
      {
        id: `${id}-i-2`,
        issue: "Value proposition below fold on key landing pages",
        severity: "Medium",
        impact: "3.6% engagement lift",
        page: "/",
      },
      {
        id: `${id}-i-3`,
        issue: "Form field count exceeds best-practice threshold",
        severity: "High",
        impact: "8.1% signup recovery potential",
        page: "/signup",
      },
      {
        id: `${id}-i-4`,
        issue: "Annual plan lacks monthly price anchor",
        severity: "Medium",
        impact: "4.8% ARPA potential",
        page: "/pricing",
      },
    ],
    recommendations: baseRecommendations,
  })
}

export {
  auditDetailsMap,
  buildAuditDetailFromAudit,
  enrichAuditDetail,
}
