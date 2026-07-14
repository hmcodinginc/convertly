import type { VertlyDomain, VertlyPageContext } from "@/features/vertly/types"

export type DomainClassification = {
  domain: VertlyDomain
  confidence: number
  scores: Record<VertlyDomain, number>
}

const ALL_DOMAINS: VertlyDomain[] = [
  "product",
  "account",
  "billing",
  "workspace",
  "audit",
  "report",
  "dashboard",
  "settings",
]

const TIE_BREAK: VertlyDomain[] = [
  "report",
  "audit",
  "account",
  "billing",
  "workspace",
  "dashboard",
  "settings",
  "product",
]

function normalize(message: string): string {
  return message.trim().toLowerCase()
}

function hasFirstPerson(message: string): boolean {
  return /\b(my|me|mine|i|i'm|i am|am i|do i|did i|have i|this)\b/i.test(message)
}

function scoreAccount(message: string): number {
  const n = normalize(message)
  if (!/\b(my|i|am i|do i|who am i)\b/i.test(n)) return 0
  if (/\bwhat plan am i\b/.test(n)) return 0.96
  if (/\bhow many audits (do )?i have\b/.test(n)) return 0.95
  if (/\baudits (do )?i have (left|remaining)\b/.test(n)) return 0.94
  if (/\bwho am i\b/.test(n)) return 0.92
  if (/\bmy (plan|usage|allowance|account|profile|name)\b/.test(n)) return 0.9
  return 0
}

function scoreBilling(message: string): number {
  const n = normalize(message)
  let score = 0
  if (/\bwhy can't i run (another|more) audit\b/.test(n)) score = Math.max(score, 0.94)
  if (/\b(can't|cannot) run (another|more) audit\b/.test(n)) score = Math.max(score, 0.92)
  if (/\b(hit|reached) (my )?(limit|allowance)\b/.test(n)) score = Math.max(score, 0.9)
  if (/\b(upgrade|downgrade|subscription|razorpay|renew)\b/.test(n)) score = Math.max(score, 0.85)
  if (/\bwhat plans\b/.test(n) && !/\bam i\b/.test(n)) score = Math.max(score, 0.88)
  if (/\bpricing\b/.test(n)) score = Math.max(score, 0.86)
  if (/\bbilling\b/.test(n)) score = Math.max(score, 0.84)
  if (hasFirstPerson(n) && /\bplan\b/.test(n)) score = Math.max(score, 0.7)
  return score
}

function scoreWorkspace(message: string): number {
  const n = normalize(message)
  let score = 0
  if (/\bwhy was (this|that) audit counted\b/.test(n)) score = Math.max(score, 0.95)
  if (/\bwhy (is|was) (this|that) (audit )?counted\b/.test(n)) score = Math.max(score, 0.94)
  if (/\baudit (history|ledger)\b/.test(n)) score = Math.max(score, 0.9)
  if (/\bcounted audit\b/.test(n)) score = Math.max(score, 0.88)
  if (/\bmy domains\b/.test(n)) score = Math.max(score, 0.86)
  if (/\bworkspace\b/.test(n)) score = Math.max(score, 0.84)
  return score
}

function scoreAudit(message: string, hasAuditContext: boolean): number {
  const n = normalize(message)
  let score = 0
  if (/\bwhat is my (current )?audit\b/.test(n)) score = Math.max(score, 0.96)
  if (/\bexplain (this|the|my|current) audit\b/.test(n)) score = Math.max(score, 0.95)
  if (/\bcurrent audit\b/.test(n) && /\bexplain\b/.test(n)) score = Math.max(score, 0.94)
  if (/\bmy audit (doing|status|progress|running)\b/.test(n)) score = Math.max(score, 0.94)
  if (/\b(current|this) audit\b/.test(n) && hasFirstPerson(n)) score = Math.max(score, 0.9)
  if (/\brunning audit\b/.test(n)) score = Math.max(score, 0.88)
  if (/\bhow long (will|until) my audit\b/.test(n)) score = Math.max(score, 0.86)
  if (hasAuditContext && /\baudit\b/.test(n) && /\b(progress|phase|stage|doing)\b/.test(n)) {
    score = Math.max(score, 0.82)
  }
  return score
}

function scoreReport(message: string, hasAuditContext: boolean): number {
  const n = normalize(message)
  let score = 0
  if (/\bwhy is my score (low|\d+)\b/.test(n)) score = Math.max(score, 0.96)
  if (/\bwhy (is|was) (my |the )?score\b/.test(n)) score = Math.max(score, 0.94)
  if (/\bexplain (this|the) (finding|recommendation|report)\b/.test(n)) score = Math.max(score, 0.95)
  if (/\bwhat does (this|the) (finding|recommendation) mean\b/.test(n)) score = Math.max(score, 0.94)
  if (/\b(fix|tackle|address) first\b/.test(n)) score = Math.max(score, 0.93)
  if (/\bwhich issue should i fix\b/.test(n)) score = Math.max(score, 0.93)
  if (/\btrust score\b/.test(n)) score = Math.max(score, 0.9)
  if (/\b(accessibility|conversion|mobile|friction|cta)\b/.test(n) && /\b(score|reduced|lower|lost)\b/.test(n)) {
    score = Math.max(score, 0.88)
  }
  if (/\bexplain (this|the) report\b/.test(n)) score = Math.max(score, 0.92)
  if (/\bgrowth score\b/.test(n)) score = Math.max(score, 0.85)
  if (hasAuditContext && /\b(score|finding|recommendation|report)\b/.test(n)) {
    score = Math.max(score, 0.75)
  }
  return score
}

function scoreDashboard(message: string): number {
  const n = normalize(message)
  if (/\bexplain (this|the) dashboard\b/.test(n)) return 0.94
  if (/\bmetric(s)?\b/.test(n)) return 0.92
  if (/\bopportunity queue\b/.test(n)) return 0.9
  if (/\btrend\b/.test(n)) return 0.88
  if (/\brecommendations?\b/.test(n) && !/\b(this|the|my) recommendation\b/.test(n)) return 0.86
  if (/\bfindings?\b/.test(n) && !/\b(this|the|my) finding\b/.test(n)) return 0.85
  if (/\bdashboard\b/.test(n)) return 0.84
  if (/\bonboarding\b/.test(n)) return 0.82
  return 0
}

function scoreSettings(message: string): number {
  const n = normalize(message)
  if (/\bsettings\b/.test(n)) return 0.88
  if (/\b(profile|notifications|security|preferences)\b/.test(n)) return 0.84
  return 0
}

function scoreProduct(message: string): number {
  const n = normalize(message)
  let score = 0.35
  if (/\bdifference between\b.*\b(page specific|full funnel)\b/.test(n)) score = Math.max(score, 0.96)
  if (/\bpage specific vs\b/.test(n)) score = Math.max(score, 0.94)
  if (/\bexplain (full funnel|page specific)\b/.test(n)) score = Math.max(score, 0.92)
  if (/\bhow long (do )?audits? (take|last|run)\b/.test(n)) score = Math.max(score, 0.9)
  if (/\bhow (do|does) audits work\b/.test(n)) score = Math.max(score, 0.88)
  if (/\bwhat is convertly\b/.test(n)) score = Math.max(score, 0.9)
  if (/\bconvertly\b/.test(n)) score = Math.max(score, 0.75)
  if (/\baudit type\b/.test(n)) score = Math.max(score, 0.85)
  return score
}

function pickDomain(scores: Record<VertlyDomain, number>): { domain: VertlyDomain; confidence: number } {
  let best = -1
  for (const domain of ALL_DOMAINS) {
    best = Math.max(best, scores[domain])
  }

  let winner: VertlyDomain = "product"
  let winnerPriority = TIE_BREAK.length

  for (const domain of ALL_DOMAINS) {
    if (scores[domain] < best - 0.001) continue
    const priority = TIE_BREAK.indexOf(domain)
    if (priority < winnerPriority) {
      winner = domain
      winnerPriority = priority
    }
  }

  return { domain: winner, confidence: scores[winner] }
}

export function classifyVertlyDomain(
  message: string,
  context: VertlyPageContext
): DomainClassification {
  const hasAuditContext = Boolean(context.auditContext)

  const scores: Record<VertlyDomain, number> = {
    product: scoreProduct(message),
    account: scoreAccount(message),
    billing: scoreBilling(message),
    workspace: scoreWorkspace(message),
    audit: scoreAudit(message, hasAuditContext),
    report: scoreReport(message, hasAuditContext),
    dashboard: scoreDashboard(message),
    settings: scoreSettings(message),
  }

  const { domain, confidence } = pickDomain(scores)
  return { domain, confidence, scores }
}
