type PageRuleTraceStats = {
  evaluated: number
  skipped: number
  passed: number
  failed: number
  findingsCreated: number
}

type AuditRuleTraceTotals = PageRuleTraceStats

const auditTotals: AuditRuleTraceTotals = {
  evaluated: 0,
  skipped: 0,
  passed: 0,
  failed: 0,
  findingsCreated: 0,
}

export function isPageRuleTraceEnabled(): boolean {
  return import.meta.env.VITE_AUDIT_RULE_TRACE === "true"
}

export function resetPageRuleTrace(): void {
  auditTotals.evaluated = 0
  auditTotals.skipped = 0
  auditTotals.passed = 0
  auditTotals.failed = 0
  auditTotals.findingsCreated = 0
}

function mergePageStats(pageStats: PageRuleTraceStats): void {
  auditTotals.evaluated += pageStats.evaluated
  auditTotals.skipped += pageStats.skipped
  auditTotals.passed += pageStats.passed
  auditTotals.failed += pageStats.failed
  auditTotals.findingsCreated += pageStats.findingsCreated
}

export function beginPageRuleTrace(pagePath: string): PageRuleTraceStats {
  const stats: PageRuleTraceStats = {
    evaluated: 0,
    skipped: 0,
    passed: 0,
    failed: 0,
    findingsCreated: 0,
  }

  console.log("")
  console.log(`PAGE: ${pagePath}`)
  console.log("")

  return stats
}

export function logPageRuleNotApplicable(ruleId: string, stats: PageRuleTraceStats): void {
  console.log(`Rule: ${ruleId}`)
  console.log("Applicable: No")
  console.log("")
  stats.skipped += 1
}

export function logPageRuleEvaluation(
  ruleId: string,
  findingCount: number,
  stats: PageRuleTraceStats
): void {
  console.log(`Rule: ${ruleId}`)
  console.log("Applicable: Yes")

  stats.evaluated += 1

  if (findingCount > 0) {
    console.log("Result: FAIL")
    console.log(`Finding created: Yes`)
    stats.failed += 1
    stats.findingsCreated += findingCount
  } else {
    console.log("Result: PASS")
    stats.passed += 1
  }

  console.log("")
}

export function endPageRuleTrace(stats: PageRuleTraceStats): void {
  console.log("Rules evaluated:", stats.evaluated)
  console.log("Rules skipped:", stats.skipped)
  console.log("Rules passed:", stats.passed)
  console.log("Rules failed:", stats.failed)
  console.log("Findings created:", stats.findingsCreated)
  console.log("")

  mergePageStats(stats)
}

export function printAuditRuleTraceSummary(): void {
  console.log("========================================")
  console.log("AUDIT PAGE RULE TRACE SUMMARY")
  console.log("========================================")
  console.log("Total page rules evaluated:", auditTotals.evaluated)
  console.log("Total passed:", auditTotals.passed)
  console.log("Total failed:", auditTotals.failed)
  console.log("Total findings created:", auditTotals.findingsCreated)
  console.log("========================================")
  console.log("")
}
