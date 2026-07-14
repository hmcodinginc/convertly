/**
 * Vertly V2 routing verification — run from client/: node scripts/verify-vertly-intent.mjs
 * Tests Convertly-only scope + domain classification (no world knowledge).
 */

const REFUSAL_PATTERNS = [
  /\b(api key|api keys|secret key|secrets?)\b/i,
  /\b(give me your|show me your|reveal your).*(key|token|secret|password)/i,
]

const OUT_OF_SCOPE_PATTERNS = [
  /\bprime minister\b/i,
  /\bwho is (the )?president\b/i,
  /\bseven wonders\b/i,
  /\bquantum physics\b/i,
  /\bwrite (a )?(python|java|c\+\+|golang|ruby|rust)\b/i,
  /\bwrite (a )?(react|vue|angular) component\b/i,
]

const CONVERTLY_SCOPE_PATTERNS = [
  /\bconvertly\b/i,
  /\baudit\b/i,
  /\bbilling\b/i,
  /\bplan\b/i,
  /\bworkspace\b/i,
  /\bdashboard\b/i,
  /\breport\b/i,
  /\bscore\b/i,
  /\bfinding\b/i,
  /\brecommendation\b/i,
  /\bmy (plan|audit|usage|account|workspace)\b/i,
  /\bexplain (this|the|my|current)\b/i,
  /\bwhy (is|was|can't)\b/i,
  /\bcounted\b/i,
]

const ALL_DOMAINS = [
  "product",
  "account",
  "billing",
  "workspace",
  "audit",
  "report",
  "dashboard",
  "settings",
]

const DOMAIN_TIE_BREAK = [
  "report",
  "audit",
  "account",
  "billing",
  "workspace",
  "dashboard",
  "settings",
  "product",
]

function normalize(message) {
  return message
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[!?.…,;:]+$/g, "")
    .trim()
}

function hasFirstPerson(message) {
  return /\b(my|me|mine|i|i'm|i am|am i|do i|this)\b/i.test(message)
}

const GREETING_EXACT = new Set([
  "hi",
  "hello",
  "hey",
  "yo",
  "sup",
  "howdy",
  "how are you",
  "what's up",
  "whats up",
  "how's it going",
  "hows it going",
  "good morning",
  "good afternoon",
  "good evening",
])

function isGreeting(message) {
  const n = normalize(message)
  if (GREETING_EXACT.has(n)) return true
  if (/^good (morning|afternoon|evening)$/.test(n)) return true
  if (/^(hi|hello|hey|yo|sup|howdy)$/.test(n)) return true
  return false
}

function isIdentity(message) {
  const n = normalize(message)
  return (
    n === "who are you" ||
    n === "what are you" ||
    n === "what is your job" ||
    n === "what do you do"
  )
}

function detectScope(message) {
  if (REFUSAL_PATTERNS.some((p) => p.test(message))) return "refusal"
  if (isIdentity(message) || isGreeting(message)) return "greeting"
  const convertly = CONVERTLY_SCOPE_PATTERNS.some((p) => p.test(message))
  const offTopic = OUT_OF_SCOPE_PATTERNS.some((p) => p.test(message))
  if (offTopic && !convertly) return "out_of_scope"
  return "in_scope"
}

function scoreAccount(message) {
  const n = normalize(message)
  if (!/\b(my|i|am i|do i|who am i)\b/i.test(n)) return 0
  if (/\bwhat plan am i\b/.test(n)) return 0.96
  if (/\bhow many audits (do )?i have\b/.test(n)) return 0.95
  if (/\baudits (do )?i have (left|remaining)\b/.test(n)) return 0.94
  return 0
}

function scoreBilling(message) {
  const n = normalize(message)
  let score = 0
  if (/\bwhy can't i run (another|more) audit\b/.test(n)) score = Math.max(score, 0.94)
  if (/\b(can't|cannot) run (another|more) audit\b/.test(n)) score = Math.max(score, 0.92)
  return score
}

function scoreWorkspace(message) {
  const n = normalize(message)
  if (/\bwhy was (this|that) audit counted\b/.test(n)) return 0.95
  if (/\bwhy (is|was) (this|that) (audit )?counted\b/.test(n)) return 0.94
  return 0
}

function scoreAudit(message) {
  const n = normalize(message)
  if (/\bwhat is my (current )?audit\b/.test(n)) return 0.96
  if (/\bexplain (this|the|my|current) audit\b/.test(n)) return 0.95
  return 0
}

function scoreReport(message) {
  const n = normalize(message)
  let score = 0
  if (/\bwhy is my score (low|\d+)\b/.test(n)) score = Math.max(score, 0.96)
  if (/\bexplain (this|the) (finding|recommendation|report)\b/.test(n)) score = Math.max(score, 0.95)
  if (/\b(fix|tackle) first\b/.test(n)) score = Math.max(score, 0.93)
  if (/\bwhich issue should i fix\b/.test(n)) score = Math.max(score, 0.93)
  if (/\btrust score\b/.test(n)) score = Math.max(score, 0.9)
  if (/\bwhat does (this|the) recommendation mean\b/.test(n)) score = Math.max(score, 0.94)
  return score
}

function scoreDashboard(message) {
  const n = normalize(message)
  if (/\bexplain (this|the) dashboard\b/.test(n)) return 0.94
  if (/\bmetric(s)?\b/.test(n)) return 0.92
  if (/\bopportunity queue\b/.test(n)) return 0.9
  if (/\btrend\b/.test(n)) return 0.88
  if (/\brecommendations?\b/.test(n) && !/\b(this|the|my) recommendation\b/.test(n)) return 0.86
  if (/\bfindings?\b/.test(n) && !/\b(this|the|my) finding\b/.test(n)) return 0.85
  return 0
}

const DASHBOARD_SUBTOPIC_RULES = [
  { subtopic: "metrics", patterns: [/\bmetric(s)?\b/, /\bgrowth score\b/, /\btrend\b/] },
  { subtopic: "opportunity-queue", patterns: [/\bopportunity queue\b/] },
  { subtopic: "recommendations", patterns: [/\brecommendations?\b/] },
  { subtopic: "findings", patterns: [/\bfindings?\b/, /\bfix first\b/] },
  { subtopic: "overview", patterns: [/\bexplain\b.*\bdashboard\b/] },
]

function classifySubtopic(message, domain) {
  const rules =
    domain === "dashboard"
      ? DASHBOARD_SUBTOPIC_RULES
      : domain === "workspace"
        ? [
            { subtopic: "counted-audits", patterns: [/\bcounted\b/, /\bwhy was (this|that) audit counted\b/] },
            { subtopic: "ledger", patterns: [/\bledger\b/] },
            { subtopic: "remaining-audits", patterns: [/\bremaining audits?\b/, /\baudits? left\b/] },
            { subtopic: "reset-date", patterns: [/\breset date\b/] },
          ]
        : domain === "billing"
          ? [
              { subtopic: "limits", patterns: [/\bwhy can't i run\b/, /\b(can't|cannot) run\b/] },
              { subtopic: "plans", patterns: [/\bplans?\b/] },
            ]
          : domain === "audit" || domain === "report"
            ? [
                { subtopic: "score", patterns: [/\bwhy is my score\b/, /\bscore low\b/] },
                { subtopic: "findings", patterns: [/\bexplain\b.*\bfinding\b/, /\bwhich issue\b/] },
                { subtopic: "recommendation", patterns: [/\brecommendation\b/] },
                { subtopic: "overview", patterns: [/\bexplain\b.*\b(report|audit)\b/] },
              ]
            : null

  if (!rules) return null

  const n = normalize(message)
  let best = null
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

function scoreProduct(message) {
  const n = normalize(message)
  let score = 0.35
  if (/\bdifference between\b.*\b(page specific|full funnel)\b/.test(n)) score = Math.max(score, 0.96)
  if (/\bexplain (full funnel|page specific)\b/.test(n)) score = Math.max(score, 0.92)
  if (/\bhow (do|does) audits work\b/.test(n)) score = Math.max(score, 0.88)
  return score
}

function classifyDomain(message) {
  const scores = {
    product: scoreProduct(message),
    account: scoreAccount(message),
    billing: scoreBilling(message),
    workspace: scoreWorkspace(message),
    audit: scoreAudit(message),
    report: scoreReport(message),
    dashboard: scoreDashboard(message),
    settings: 0,
  }

  let best = -1
  for (const domain of ALL_DOMAINS) best = Math.max(best, scores[domain])

  let winner = "product"
  let priority = DOMAIN_TIE_BREAK.length
  for (const domain of ALL_DOMAINS) {
    if (scores[domain] < best - 0.001) continue
    const p = DOMAIN_TIE_BREAK.indexOf(domain)
    if (p < priority) {
      winner = domain
      priority = p
    }
  }

  return winner
}

const GREETING_EXAMPLES = [
  "hi",
  "Hi",
  "HI",
  "hello",
  "Hello",
  "HELLO",
  "hey",
  "Hey",
  "HEY",
  "good morning",
  "Good Morning",
  "GOOD MORNING",
  "good afternoon",
  "good evening",
  "how are you",
  "what's up",
  "yo",
  "Who are you?",
  "What do you do?",
]

const SCOPE_EXAMPLES = [
  { message: "Who is Prime Minister?", expected: "out_of_scope" },
  { message: "Seven wonders", expected: "out_of_scope" },
  { message: "Write Python code", expected: "out_of_scope" },
  { message: "What plan am I on?", expected: "in_scope" },
]

const DOMAIN_EXAMPLES = [
  { message: "What plan am I on?", expected: "account" },
  { message: "How many audits do I have left?", expected: "account" },
  { message: "Explain Full Funnel Audit.", expected: "product" },
  {
    message: "Difference between Page Specific and Full Funnel.",
    expected: "product",
  },
  { message: "Why is my score low?", expected: "report" },
  { message: "Explain this finding.", expected: "report" },
  { message: "Which issue should I fix first?", expected: "report" },
  { message: "Explain this dashboard.", expected: "dashboard" },
  { message: "Why was this audit counted?", expected: "workspace" },
  { message: "Why can't I run another audit?", expected: "billing" },
  { message: "Explain this report.", expected: "report" },
  { message: "What does this recommendation mean?", expected: "report" },
  { message: "Explain current audit", expected: "audit" },
  { message: "What is my current audit?", expected: "audit" },
  { message: "Explain metrics", expected: "dashboard" },
]

const SUBTOPIC_EXAMPLES = [
  { message: "Explain metrics", domain: "dashboard", expected: "metrics" },
  { message: "Explain this dashboard.", domain: "dashboard", expected: "overview" },
  { message: "Why was this audit counted?", domain: "workspace", expected: "counted-audits" },
  { message: "Why can't I run another audit?", domain: "billing", expected: "limits" },
  { message: "Why is my score low?", domain: "report", expected: "score" },
  { message: "Explain this finding.", domain: "report", expected: "findings" },
]

console.log("Vertly V2 Routing Verification\n")

let failures = 0

console.log("--- Scope ---")
for (const example of SCOPE_EXAMPLES) {
  const scope = detectScope(example.message)
  const ok = scope === example.expected
  if (!ok) failures += 1
  console.log(`${ok ? "PASS" : "FAIL"} | "${example.message}" → ${scope} (expected ${example.expected})`)
}

console.log("\n--- Greetings (case-insensitive) ---")
for (const message of GREETING_EXAMPLES) {
  const scope = detectScope(message)
  const ok = scope === "greeting"
  if (!ok) failures += 1
  console.log(`${ok ? "PASS" : "FAIL"} | "${message}" → ${scope} (expected greeting)`)
}

console.log("\n--- Domain (in-scope Convertly) ---")
for (const example of DOMAIN_EXAMPLES) {
  const scope = detectScope(example.message)
  if (scope !== "in_scope") {
    failures += 1
    console.log(`FAIL | "${example.message}" → scope ${scope} (expected in_scope)`)
    continue
  }
  const domain = classifyDomain(example.message)
  const ok = domain === example.expected
  if (!ok) failures += 1
  console.log(
    `${ok ? "PASS" : "FAIL"} | "${example.message}" → ${domain} (expected ${example.expected})`
  )
}

console.log("\n--- Subtopic (message-first, page enriches only) ---")
for (const example of SUBTOPIC_EXAMPLES) {
  const subtopic = classifySubtopic(example.message, example.domain)
  const ok = subtopic === example.expected
  if (!ok) failures += 1
  console.log(
    `${ok ? "PASS" : "FAIL"} | "${example.message}" [${example.domain}] → ${subtopic} (expected ${example.expected})`
  )
}

console.log(`\n${failures === 0 ? "All tests passed." : `${failures} failure(s).`}`)
process.exit(failures > 0 ? 1 : 0)
