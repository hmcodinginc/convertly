import type { VertlyConversationRequest, VertlyConversationResponse, VertlyRoutingResult } from "@/features/vertly/types"

function formatBlock(answer: string, details?: string, context?: string): string {
  const parts = [answer]
  if (details) parts.push(details)
  if (context) parts.push(context)
  return parts.join("\n\n")
}

export function handleDashboardRoute(
  request: VertlyConversationRequest,
  routing: VertlyRoutingResult
): VertlyConversationResponse {
  const subtopic = routing.subtopic ?? "overview"
  const audit = request.context.auditContext

  let content: string

  switch (subtopic) {
    case "metrics":
      content = formatBlock(
        "**Growth Score** is your overall conversion health (0–100) for the selected audit.",
        "**Findings counts** show open issues by severity. **Trend** compares against your previous audit when one exists.",
        audit?.overallScore != null
          ? `Selected audit: **${audit.overallScore}/100**${audit.scoreDelta ? ` (${audit.scoreDelta > 0 ? "+" : ""}${audit.scoreDelta} vs last run)` : ""}.`
          : undefined
      )
      break
    case "opportunity-queue":
      content = formatBlock(
        "The **Opportunity Queue** surfaces quick wins — high-impact, lower-effort fixes you can ship this week.",
        "Items are ranked from your latest audit findings and recommendations.",
        audit?.topRecommendations[0]
          ? `Top queued opportunity: **${audit.topRecommendations[0].title}**.`
          : undefined
      )
      break
    case "recommendations":
      content = formatBlock(
        "Dashboard **recommendations** are actionable fixes from your latest audit, with priority and estimated lift.",
        "Open an audit report for full detail and playbook guidance.",
        audit?.topRecommendations[0]
          ? `Leading recommendation: **${audit.topRecommendations[0].title}** (${audit.topRecommendations[0].priority}).`
          : undefined
      )
      break
    case "findings":
      content = formatBlock(
        "**Findings** are prioritized issues from your audit — Critical and High items usually move the score fastest.",
        "Each finding includes severity, category, and business impact.",
        audit
          ? `Current audit: **${audit.criticalFindings} critical**, **${audit.highFindings} high**, **${audit.mediumFindings} medium** findings.`
          : undefined
      )
      break
    case "overview":
    default:
      content = formatBlock(
        "The dashboard summarizes conversion health for your selected audit.",
        "It combines metrics, prioritized findings, an opportunity queue, and recommendations in one view."
      )
      break
  }

  return {
    content,
    suggestions: [
      { id: "db-metrics", label: "Explain metrics", prompt: "Explain metrics." },
      { id: "db-fix", label: "What to fix first", prompt: "Which issue should I fix first?" },
      { id: "db-growth", label: "Growth Score", prompt: "What is Growth Score?" },
      { id: "db-queue", label: "Opportunity queue", prompt: "What is the opportunity queue?" },
      { id: "db-usage", label: "Audits remaining", prompt: "How many audits do I have left?" },
    ],
  }
}
