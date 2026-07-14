import type { VertlyConversationRequest, VertlyConversationResponse } from "@/features/vertly/types"

export function handleOutOfScopeRoute(
  _request: VertlyConversationRequest
): VertlyConversationResponse {
  return {
    content:
      "I'm designed to help with Convertly — your audits, reports, billing, and workspace.\n\n" +
      "General knowledge will become available once HX AI / Ollama integration ships. " +
      "For now, ask me anything about Convertly and I'll give you a straight answer.",
    suggestions: [
      {
        id: "oos-product",
        label: "What is Convertly?",
        prompt: "What is Convertly?",
      },
      {
        id: "oos-audit",
        label: "How audits work",
        prompt: "How do Convertly audits work?",
      },
      {
        id: "oos-plan",
        label: "My plan",
        prompt: "What plan am I on?",
      },
    ],
  }
}
