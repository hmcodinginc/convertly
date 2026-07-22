import {
  buildProductMemoryAnswer,
  resolveProductMemoryTopic,
} from "@/features/vertly/content/productMemory"
import { ROUTES } from "@/lib/routes"
import type { VertlyConversationRequest, VertlyConversationResponse } from "@/features/vertly/types"

function appendRunningAuditNote(
  answer: string,
  request: VertlyConversationRequest
): string {
  const audit = request.context.auditContext
  if (!audit) return answer

  const isRunning =
    audit.status === "pending" ||
    audit.status === "crawling" ||
    audit.status === "analyzing"

  const normalized = request.message.trim().toLowerCase()
  const asksAboutTiming = /\b(how long|duration|time|take)\b/.test(normalized)

  if (isRunning && asksAboutTiming) {
    return (
      `${answer}\n\n` +
      `You have a run in progress for **${audit.website}**${
        audit.progress != null ? ` (${Math.round(audit.progress)}%)` : ""
      }.`
    )
  }

  return answer
}

export function handleProductRoute(
  request: VertlyConversationRequest
): VertlyConversationResponse {
  const topic = resolveProductMemoryTopic(request.message) ?? "audits"

  const content = appendRunningAuditNote(buildProductMemoryAnswer(topic), request)

  return {
    content,
    suggestions: [
      {
        id: "pm-audit",
        label: "How audits work",
        prompt: "How do audits work?",
      },
      {
        id: "pm-plans",
        label: "Plans & limits",
        prompt: "What plans does Convertly offer?",
        href: ROUTES.billing,
      },
      {
        id: "pm-score",
        label: "Growth Score",
        prompt: "What is Growth Score?",
      },
      {
        id: "pm-first",
        label: "Run an audit",
        prompt: "How do I run my first audit?",
      },
    ],
  }
}
