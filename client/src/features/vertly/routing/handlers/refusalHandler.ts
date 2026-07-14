import type { VertlyConversationRequest, VertlyConversationResponse } from "@/features/vertly/types"

export function handleRefusalRoute(
  _request: VertlyConversationRequest
): VertlyConversationResponse {
  return {
    content:
      "I can't share API keys, secrets, tokens, credentials, or internal implementation details.\n\n" +
      "I'm here to help with Convertly — audits, your plan, workspace usage, reports, and product guidance. Ask about those instead.",
    suggestions: [
      {
        id: "ref-audits",
        label: "How audits work",
        prompt: "How do Convertly audits work?",
      },
      {
        id: "ref-usage",
        label: "My usage",
        prompt: "How many audits do I have left?",
      },
    ],
  }
}
