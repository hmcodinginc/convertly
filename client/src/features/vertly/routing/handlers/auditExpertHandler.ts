import { ROUTES } from "@/lib/routes"
import type {
  VertlyAuditSnapshot,
  VertlyConversationRequest,
  VertlyConversationResponse,
  VertlyRoutingResult,
} from "@/features/vertly/types"

const STAGE_LABELS: Record<string, string> = {
  pending: "Starting",
  crawling: "Discovering pages",
  analyzing: "Analyzing pages",
  completed: "Completed",
  failed: "Failed",
  "preparing-workspace": "Preparing workspace",
  "discovering-pages": "Discovering pages",
  "calculating-scores": "Calculating scores",
  "building-recommendations": "Building recommendations",
  "finalizing-report": "Finalizing report",
}

function isRunning(status: string): boolean {
  return status === "pending" || status === "crawling" || status === "analyzing"
}

function formatScoreExplanation(audit: VertlyAuditSnapshot): string {
  const score = audit.overallScore ?? 0
  const weakCategories = (audit.scoreBreakdown ?? [])
    .filter((item) => item.status !== "Strong")
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)

  const lines = [`Your website scored **${score}/100** on **${audit.website}**.`]

  if (audit.scoreDelta != null && audit.scoreDelta !== 0) {
    lines.push(
      audit.scoreDelta > 0
        ? `That's **+${audit.scoreDelta}** from your previous audit.`
        : `That's **${audit.scoreDelta}** from your previous audit.`
    )
  }

  if (weakCategories.length > 0) {
    const drivers = weakCategories
      .map((cat) => {
        const impacts = cat.topImpacts?.slice(0, 2).map((i) => i.title).join(", ")
        return impacts
          ? `**${cat.label}** (${cat.score}) — ${impacts}`
          : `**${cat.label}** (${cat.score})`
      })
      .join("\n")
    lines.push(`Most lost points came from:\n${drivers}`)
  } else if (audit.topIssues.length > 0) {
    const top = audit.topIssues.slice(0, 3).map((i) => `**${i.severity}** — ${i.issue}`).join("\n")
    lines.push(`Top issues dragging the score:\n${top}`)
  }

  if (audit.growthPotential != null && audit.growthPotential > score) {
    lines.push(
      `Fixing prioritized issues could lift your score toward **${audit.growthPotential}** based on recoverable points in this report.`
    )
  }

  lines.push("Fixing the highest-severity CTA, trust, and mobile issues first usually produces the biggest improvement.")
  return lines.join("\n\n")
}

function formatFixFirst(audit: VertlyAuditSnapshot): string {
  const rec = audit.topRecommendations[0]
  const issue = audit.topIssues[0]

  if (rec) {
    return (
      `Start with **${rec.title}** (${rec.priority} priority, ${rec.category}).\n\n` +
      `${rec.summary ?? rec.title}\n\n` +
      `Estimated lift: **${rec.estimatedLift}**. ` +
      (issue ? `It addresses a **${issue.severity}** finding: ${issue.issue}` : "") +
      `\n\nTackle Critical and High items before Medium — they compound across your funnel.`
    )
  }

  if (issue) {
    return (
      `Fix **${issue.issue}** first (${issue.severity}, ${issue.category ?? "general"}).\n\n` +
      `${issue.impact}\n\n` +
      "This is your highest-severity open finding in the current report."
    )
  }

  return "This audit has no open findings — great work. Consider a re-audit after your next round of changes to measure progress."
}

function formatCategoryScore(audit: VertlyAuditSnapshot, category: string): string {
  const match = (audit.scoreBreakdown ?? []).find((item) =>
    item.label.toLowerCase().includes(category.toLowerCase())
  )

  if (!match) {
    return `I don't see a **${category}** breakdown in the current audit context. Open the audit report for category-level scores.`
  }

  const impacts =
    match.topImpacts && match.topImpacts.length > 0
      ? match.topImpacts.map((i) => `• ${i.title} (${i.count} finding${i.count === 1 ? "" : "s"})`).join("\n")
      : "No specific drivers listed — review page findings in this category."

  return (
    `**${match.label} score: ${match.score}/100** (${match.status})\n\n` +
    `What reduced it:\n${impacts}\n\n` +
    "Check the recommendations tab for fixes mapped to these findings."
  )
}

function formatStrengths(audit: VertlyAuditSnapshot): string {
  if (audit.strengths && audit.strengths.length > 0) {
    const list = audit.strengths.map((s) => `• ${s}`).join("\n")
    return `**Strengths** in this audit:\n${list}\n\nThese categories scored well and support conversion performance.`
  }

  const strongCategories = (audit.scoreBreakdown ?? [])
    .filter((item) => item.status === "Strong")
    .slice(0, 3)

  if (strongCategories.length > 0) {
    return (
      "**Strong categories:**\n" +
      strongCategories.map((cat) => `• **${cat.label}** (${cat.score}/100)`).join("\n")
    )
  }

  return "No standout strengths flagged in the current audit context."
}

function formatWeaknesses(audit: VertlyAuditSnapshot, message: string): string {
  const normalized = message.toLowerCase()
  if (/\btrust score\b/.test(normalized)) return formatCategoryScore(audit, "trust")
  if (/\baccessibility\b/.test(normalized)) return formatCategoryScore(audit, "mobile")

  const weakCategories = (audit.scoreBreakdown ?? [])
    .filter((item) => item.status !== "Strong")
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)

  if (weakCategories.length > 0) {
    const drivers = weakCategories
      .map((cat) => {
        const impacts = cat.topImpacts?.slice(0, 2).map((i) => i.title).join(", ")
        return impacts
          ? `**${cat.label}** (${cat.score}) — ${impacts}`
          : `**${cat.label}** (${cat.score})`
      })
      .join("\n")
    return `**Weak areas** dragging your score:\n${drivers}\n\nFix Critical and High findings in these categories first.`
  }

  if (audit.topIssues.length > 0) {
    const top = audit.topIssues.slice(0, 3).map((i) => `**${i.severity}** — ${i.issue}`).join("\n")
    return `**Top issues** reducing your score:\n${top}`
  }

  return "No major weaknesses flagged in the current audit context."
}

function formatRunningAudit(audit: VertlyAuditSnapshot): string {
  const stageLabel = STAGE_LABELS[audit.stage ?? ""] ?? STAGE_LABELS[audit.status] ?? "Running"
  const lines = [
    `Your audit for **${audit.website}** is **${stageLabel}**.`,
    audit.progress != null ? `Progress: **${Math.round(audit.progress)}%**` : null,
    audit.currentTask ? `Currently: ${audit.currentTask}` : null,
    audit.pagesScanned > 0 ? `Pages scanned so far: **${audit.pagesScanned}**` : null,
  ].filter(Boolean)

  if (audit.criticalFindings + audit.highFindings > 0) {
    lines.push(
      `Early signals: **${audit.criticalFindings} critical** and **${audit.highFindings} high** findings detected so far.`
    )
  }

  lines.push("You'll be redirected to the full report when the run completes.")
  return lines.join("\n\n")
}

function formatExplainAudit(audit: VertlyAuditSnapshot): string {
  if (isRunning(audit.status)) {
    return formatRunningAudit(audit)
  }

  const lines: string[] = []

  if (audit.auditTypeLabel) {
    lines.push(`This is a **${audit.auditTypeLabel}** for **${audit.website}**.`)
  } else {
    lines.push(`Here's your audit for **${audit.website}**.`)
  }

  lines.push(
    `**Growth Score: ${audit.overallScore ?? "—"}/100** across **${audit.pagesScanned}** pages analyzed.`
  )

  const findingTotal =
    audit.criticalFindings + audit.highFindings + audit.mediumFindings + audit.lowFindings
  if (findingTotal > 0) {
    lines.push(
      `**Findings:** ${audit.criticalFindings} critical · ${audit.highFindings} high · ${audit.mediumFindings} medium · ${audit.lowFindings} low`
    )
  }

  const topIssue = audit.topIssues[0]
  if (topIssue) {
    lines.push(
      `**Biggest issue:** ${topIssue.issue} (${topIssue.severity}${topIssue.category ? ` · ${topIssue.category}` : ""}).\n${topIssue.impact}`
    )
  }

  if (audit.strengths && audit.strengths.length > 0) {
    lines.push(`**Biggest strength:** ${audit.strengths[0]}.`)
  }

  const topRec = audit.topRecommendations[0]
  if (topRec) {
    lines.push(
      `**Fix first:** **${topRec.title}** (${topRec.priority} priority, ${topRec.estimatedLift} estimated lift).\n${topRec.summary ?? topRec.title}`
    )
  } else if (topIssue) {
    lines.push(`**Fix first:** Address the ${topIssue.severity.toLowerCase()} finding — ${topIssue.issue}.`)
  }

  return lines.join("\n\n")
}

function formatAuditOverview(audit: VertlyAuditSnapshot): string {
  if (isRunning(audit.status)) {
    return formatRunningAudit(audit)
  }

  const typeLine = audit.auditTypeLabel ? `**Audit type:** ${audit.auditTypeLabel}\n\n` : ""
  const recPreview =
    audit.topRecommendations.length > 0
      ? `Top recommendation: **${audit.topRecommendations[0].title}** (${audit.topRecommendations[0].priority}).`
      : ""

  return (
    `${typeLine}` +
    `**${audit.website}** scored **${audit.overallScore ?? "—"}/100** across **${audit.pagesScanned}** pages.\n\n` +
    `Findings: **${audit.criticalFindings} critical**, **${audit.highFindings} high**, **${audit.mediumFindings} medium**, **${audit.lowFindings} low**.\n\n` +
    `${recPreview}\n\n` +
    (audit.strengths?.length
      ? `Strengths: ${audit.strengths.slice(0, 3).join(", ")}.`
      : "Ask about score drivers, a specific finding, or what to fix first.")
  )
}

function formatRecommendation(audit: VertlyAuditSnapshot, message: string): string {
  const selected = audit.selectedRecommendation
  const normalized = message.toLowerCase()

  let rec = selected
    ? audit.topRecommendations.find((r) => r.id === selected.id) ?? {
        ...selected,
        estimatedLift: "—",
        summary: selected.title,
      }
    : undefined

  if (!rec) {
    const byTitle = audit.topRecommendations.find((r) =>
      normalized.includes(r.title.toLowerCase().slice(0, 20))
    )
    rec = byTitle ?? audit.topRecommendations[0]
  }

  if (!rec) {
    return "No recommendations in the current audit context. Complete an audit first, then open its report."
  }

  return (
    `**${rec.title}** (${rec.priority} priority · ${rec.category})\n\n` +
    `${rec.summary ?? rec.title}\n\n` +
    `Estimated lift: **${rec.estimatedLift}**.\n\n` +
    "Open the playbook drawer for step-by-step implementation guidance."
  )
}

function formatFinding(audit: VertlyAuditSnapshot): string {
  const finding = audit.selectedFinding ?? audit.topIssues[0]
  if (!finding) {
    return "No findings in the current audit context."
  }

  return (
    `**${finding.issue}** (${finding.severity}${finding.category ? ` · ${finding.category}` : ""})\n\n` +
    `${finding.impact ?? "See the audit report for impact details."}` +
    (finding.page ? `\n\nAffected page: ${finding.page}` : "")
  )
}

export function handleAuditExpertRoute(
  request: VertlyConversationRequest,
  routing: VertlyRoutingResult
): VertlyConversationResponse {
  const audit = request.context.auditContext
  const subtopic = routing.subtopic

  if (!audit) {
    return {
      content:
        "Open an audit report or start a running audit to get specific answers about scores, findings, and recommendations.\n\n" +
        "I can still explain how Convertly audits work in general.",
      suggestions: [
        { id: "ae-types", label: "Audit types", prompt: "Explain Full Funnel Audit." },
        { id: "ae-work", label: "How audits work", prompt: "How do Convertly audits work?" },
      ],
    }
  }

  let content: string

  switch (subtopic) {
    case "timing":
      content = isRunning(audit.status) ? formatRunningAudit(audit) : formatAuditOverview(audit)
      break
    case "score":
      content = formatScoreExplanation(audit)
      break
    case "findings":
      content =
        /\b(fix|tackle|address) first\b/.test(request.message.toLowerCase()) ||
        /\bwhich issue\b/.test(request.message.toLowerCase())
          ? formatFixFirst(audit)
          : formatFinding(audit)
      break
    case "recommendation":
      content = formatRecommendation(audit, request.message)
      break
    case "strengths":
      content = formatStrengths(audit)
      break
    case "weaknesses":
      content = formatWeaknesses(audit, request.message)
      break
    case "overview":
      content = formatExplainAudit(audit)
      break
    default:
      content = formatAuditOverview(audit)
      break
  }

  return {
    content,
    suggestions: [
      {
        id: "ae-fix",
        label: "What to fix first",
        prompt: "Which issue should I fix first?",
      },
      {
        id: "ae-score",
        label: "Why this score",
        prompt: "Why is my score low?",
      },
      {
        id: "ae-rec",
        label: "Top recommendation",
        prompt: "What does the top recommendation mean?",
        href: ROUTES.audits,
      },
    ],
  }
}
