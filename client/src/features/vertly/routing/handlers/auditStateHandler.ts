import type { VertlyConversationRequest, VertlyConversationResponse } from "@/features/vertly/types"

const STAGE_LABELS: Record<string, string> = {
  pending: "Starting",
  crawling: "Discovering pages",
  analyzing: "Analyzing pages",
  completed: "Completed",
  failed: "Failed",
}

const STAGE_ETA: Record<string, string> = {
  pending: "About 1–2 minutes to begin discovery",
  crawling: "About 2–5 minutes depending on site size",
  analyzing: "About 2–4 minutes for rules and scoring",
}

function isRunningStatus(status: string): boolean {
  return status === "pending" || status === "crawling" || status === "analyzing"
}

export function handleAuditStateRoute(
  request: VertlyConversationRequest
): VertlyConversationResponse {
  const meta = request.context.metadata ?? {}
  const domain = String(meta.domain ?? "")
  const stage = String(meta.stage ?? meta.status ?? "")
  const progress =
    typeof meta.progress === "number" ? Math.round(meta.progress) : null
  const hasRunningAudit = Boolean(domain) && isRunningStatus(stage)

  if (!hasRunningAudit) {
    return {
      content:
        "I don't see a running audit in your current view.\n\n" +
        "Start one from **New Audit**, or open an in-progress run to ask about live progress, phase, and estimated time remaining.",
      suggestions: [
        {
          id: "as-start",
          label: "How to start",
          prompt: "How do I run a conversion audit?",
        },
        {
          id: "as-duration",
          label: "How long audits take",
          prompt: "How long do audits take?",
        },
      ],
    }
  }

  const stageLabel = STAGE_LABELS[stage] ?? "Running"
  const eta = STAGE_ETA[stage] ?? "A few minutes remaining"

  const lines = [
    `Your audit for **${domain}** is currently **${stageLabel}**.`,
    progress != null ? `Progress: **${progress}%**` : null,
    `**Current phase:** ${stageLabel}`,
    `**Estimated remaining:** ${eta}`,
  ].filter(Boolean)

  if (stage === "crawling") {
    lines.push(
      "Convertly is discovering and verifying public pages. Page count updates as reachable URLs are confirmed."
    )
  }

  if (stage === "analyzing") {
    lines.push(
      "The rule engine is evaluating UX, copy, trust, and conversion signals on discovered pages."
    )
  }

  lines.push("You'll be redirected to the full report automatically when the run completes.")

  return {
    content: lines.join("\n\n"),
    suggestions: [
      {
        id: "as-phase",
        label: "What happens next?",
        prompt: "What phase comes after this in the audit?",
      },
      {
        id: "as-time",
        label: "Time remaining",
        prompt: "How much longer will this audit take?",
      },
    ],
  }
}
