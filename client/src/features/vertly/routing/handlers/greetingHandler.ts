import { matchConversationalIntent } from "@/features/vertly/routing/conversationalIntents"
import type { VertlyConversationRequest, VertlyConversationResponse } from "@/features/vertly/types"

/**
 * Fallback for greeting-scope routes. Prefer conversationalIntents via the orchestrator.
 */
export function handleGreetingRoute(
  request: VertlyConversationRequest
): VertlyConversationResponse {
  const conversational = matchConversationalIntent(request)
  if (conversational) return conversational

  return {
    content:
      "Hey — good to see you. I'm Vertly, Convertly's product specialist.\n\n" +
      "Ask me about audits, reports, your plan, billing, or workspace.",
    suggestions: [
      {
        id: "gr-audits",
        label: "How audits work",
        prompt: "How do Convertly audits work?",
      },
      {
        id: "gr-usage",
        label: "My remaining audits",
        prompt: "How many audits do I have left?",
      },
      {
        id: "gr-types",
        label: "Audit types",
        prompt: "Explain Full Funnel Audit.",
      },
    ],
  }
}
