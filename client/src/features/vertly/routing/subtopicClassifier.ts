import type {
  AuditSubtopic,
  BillingSubtopic,
  DashboardSubtopic,
  VertlyDomain,
  VertlySubtopic,
  WorkspaceSubtopic,
} from "@/features/vertly/types"

type SubtopicRule = {
  subtopic: VertlySubtopic
  patterns: RegExp[]
}

function normalize(message: string): string {
  return message.trim().toLowerCase().replace(/\s+/g, " ")
}

function matchSubtopic(message: string, rules: SubtopicRule[]): VertlySubtopic | null {
  const n = normalize(message)
  let best: { subtopic: VertlySubtopic; score: number } | null = null

  for (const rule of rules) {
    let score = 0
    for (const pattern of rule.patterns) {
      if (pattern.test(n)) score += 1
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { subtopic: rule.subtopic, score }
    }
  }

  return best?.subtopic ?? null
}

const DASHBOARD_RULES: SubtopicRule[] = [
  {
    subtopic: "metrics",
    patterns: [
      /\bmetric(s)?\b/,
      /\bgrowth score\b/,
      /\bscore delta\b/,
      /\btrend\b/,
      /\bscore breakdown\b/,
      /\bexplain\b.*\b(score|metric|trend)\b/,
    ],
  },
  {
    subtopic: "opportunity-queue",
    patterns: [/\bopportunity queue\b/, /\bquick wins?\b/, /\bopportunities\b/],
  },
  {
    subtopic: "recommendations",
    patterns: [/\brecommendations?\b/, /\bfix(es)? to (make|try)\b/, /\baction items?\b/],
  },
  {
    subtopic: "findings",
    patterns: [
      /\bfindings?\b/,
      /\bissues?\b/,
      /\bprioriti(z|s)ed\b/,
      /\bwhat should i fix\b/,
      /\bfix first\b/,
    ],
  },
  {
    subtopic: "overview",
    patterns: [/\bexplain\b.*\bdashboard\b/, /\bwhat is (the )?dashboard\b/, /\bdashboard overview\b/],
  },
]

const WORKSPACE_RULES: SubtopicRule[] = [
  {
    subtopic: "counted-audits",
    patterns: [
      /\bcounted\b/,
      /\bwhy was (this|that|it) (audit )?counted\b/,
      /\bwhy (is|was) (this|that) counted\b/,
      /\bwhat counts?\b/,
    ],
  },
  {
    subtopic: "ledger",
    patterns: [/\bledger\b/, /\baudit history\b/, /\bsession(s)? list\b/],
  },
  {
    subtopic: "remaining-audits",
    patterns: [
      /\bremaining audits?\b/,
      /\baudits? left\b/,
      /\busage breakdown\b/,
      /\bhow many (used|audits)\b/,
    ],
  },
  {
    subtopic: "reset-date",
    patterns: [/\breset date\b/, /\bwhen (does|do) (it|allowance) reset\b/, /\ballowance reset\b/],
  },
  {
    subtopic: "overview",
    patterns: [/\bexplain\b.*\bworkspace\b/, /\bwhat is (the )?workspace\b/],
  },
]

const BILLING_RULES: SubtopicRule[] = [
  {
    subtopic: "limits",
    patterns: [
      /\b(can't|cannot) run\b/,
      /\bwhy can't i run\b/,
      /\b(hit|reached) (my )?(limit|allowance)\b/,
      /\baudit limit\b/,
    ],
  },
  {
    subtopic: "plans",
    patterns: [/\bplans?\b/, /\bpricing\b/, /\bcompare plans\b/, /\bwhat plans\b/, /\bfree plan\b/],
  },
  {
    subtopic: "upgrades",
    patterns: [/\bupgrade\b/, /\bdowngrade\b/, /\bchange plan\b/, /\bswitch plan\b/],
  },
  {
    subtopic: "renewals",
    patterns: [/\brenew(al)?\b/, /\bsubscription\b/, /\bcancel\b/, /\bbilling cycle\b/],
  },
  {
    subtopic: "overview",
    patterns: [/\bhow (does|do) billing work\b/, /\bexplain\b.*\bbilling\b/],
  },
]

const AUDIT_RULES: SubtopicRule[] = [
  {
    subtopic: "timing",
    patterns: [
      /\b(progress|phase|stage|running|doing)\b/,
      /\bhow long (will|until)\b/,
      /\bestimated time\b/,
      /\bcurrent(ly)? (running|phase)\b/,
    ],
  },
  {
    subtopic: "score",
    patterns: [
      /\bwhy (is|was) (my |the )?score\b/,
      /\bscore (low|\d+)\b/,
      /\bgrowth score\b/,
      /\bexplain\b.*\bscore\b/,
    ],
  },
  {
    subtopic: "findings",
    patterns: [/\bfinding(s)?\b/, /\bexplain\b.*\bfinding\b/, /\bissue(s)?\b/],
  },
  {
    subtopic: "recommendation",
    patterns: [/\brecommendation(s)?\b/, /\bwhat does (this|the) recommendation mean\b/],
  },
  {
    subtopic: "strengths",
    patterns: [/\bstrength(s)?\b/, /\bwhat('s| is) (working|good)\b/, /\bpositives?\b/],
  },
  {
    subtopic: "weaknesses",
    patterns: [
      /\bweakness(es)?\b/,
      /\bweak (areas?|categories?)\b/,
      /\blost points\b/,
      /\bdragging (the )?score\b/,
    ],
  },
  {
    subtopic: "overview",
    patterns: [
      /\bexplain\b.*\b(this|the|my|current) audit\b/,
      /\bwhat is my (current )?audit\b/,
      /\bexplain\b.*\breport\b/,
      /\bcurrent audit\b/,
    ],
  },
]

const RULES_BY_DOMAIN: Partial<Record<VertlyDomain, SubtopicRule[]>> = {
  dashboard: DASHBOARD_RULES,
  workspace: WORKSPACE_RULES,
  billing: BILLING_RULES,
  audit: AUDIT_RULES,
  report: AUDIT_RULES,
}

export function classifyVertlySubtopic(
  message: string,
  domain: VertlyDomain
): VertlySubtopic | null {
  const rules = RULES_BY_DOMAIN[domain]
  if (!rules) return null
  return matchSubtopic(message, rules)
}

export function isPageOverviewRequest(message: string, domain: VertlyDomain): boolean {
  const n = normalize(message)
  switch (domain) {
    case "dashboard":
      return /\bexplain\b.*\bdashboard\b/.test(n) || /\bwhat is (the )?dashboard\b/.test(n)
    case "workspace":
      return /\bexplain\b.*\bworkspace\b/.test(n) || /\bwhat is (the )?workspace\b/.test(n)
    case "billing":
      return /\bexplain\b.*\bbilling\b/.test(n) || /\bhow (does|do) billing work\b/.test(n)
    default:
      return false
  }
}

export type { DashboardSubtopic, WorkspaceSubtopic, BillingSubtopic, AuditSubtopic }
