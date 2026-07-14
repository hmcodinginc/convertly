import {
  isVertlyIdentityQuestion,
} from "@/features/vertly/routing/normalizeVertlyMessage"
import type { VertlyConversationRequest, VertlyConversationResponse } from "@/features/vertly/types"

function identityResponse(): VertlyConversationResponse {
  return {
    content:
      "I'm **Vertly**, Convertly's AI Product Specialist.\n\n" +
      "I help you understand audits, reports, dashboards, billing, workspaces, and how to improve your website using Convertly.\n\n" +
      "I'm not a general-purpose AI assistant. After launch I'll gain broader capabilities through HX AI / Ollama integration.\n\n" +
      "What would you like to know about Convertly?",
    suggestions: [
      {
        id: "id-audits",
        label: "How audits work",
        prompt: "How do Convertly audits work?",
      },
      {
        id: "id-dashboard",
        label: "Explain dashboard",
        prompt: "Explain this dashboard.",
      },
      {
        id: "id-plan",
        label: "My plan",
        prompt: "What plan am I on?",
      },
    ],
  }
}

export function handleGreetingRoute(
  request: VertlyConversationRequest
): VertlyConversationResponse {
  if (isVertlyIdentityQuestion(request.message)) {
    return identityResponse()
  }

  return {
    content:
      "Hey — good to see you. I'm Vertly, Convertly's AI Product Specialist.\n\n" +
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
