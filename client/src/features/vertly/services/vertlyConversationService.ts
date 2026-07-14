import { routeVertlyResponse } from "@/features/vertly/routing/vertlyOrchestrator"
import type {
  VertlyConversationRequest,
  VertlyConversationResponse,
  VertlyPageContext,
  VertlyVariant,
} from "@/features/vertly/types"

export async function requestVertlyResponse(
  request: VertlyConversationRequest,
  onChunk?: (chunk: string) => void
): Promise<VertlyConversationResponse> {
  const response = routeVertlyResponse(request)
  const text = response.content

  if (!onChunk) {
    await delay(420)
    return response
  }

  const words = text.split(/(\s+)/)
  let assembled = ""

  for (const part of words) {
    assembled += part
    onChunk(assembled)
    await delay(part.trim() ? 18 : 6)
  }

  return { ...response, content: assembled }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export function getSignupWelcomeMessage(): string {
  return (
    "Welcome to Convertly.\n\n" +
    "I'm Vertly, your AI product specialist. I'll help you understand your website, " +
    "interpret audit results, and improve conversions with confidence.\n\n" +
    "Create your account, then run your first audit — I'll guide you from there."
  )
}

export function getPanelWelcomeMessage(
  _pageContext: VertlyPageContext,
  variant: VertlyVariant
): string {
  if (variant === "signup") {
    return getSignupWelcomeMessage()
  }

  if (variant === "guest-auth") {
    return (
      "Hi — I'm Vertly.\n\n" +
      "Sign in to unlock live answers about your plan, usage, and audits. " +
      "I can still explain Convertly features while you're on auth pages."
    )
  }

  if (variant === "marketing") {
    return (
      "Hi — I'm Vertly, Convertly's AI Product Specialist.\n\n" +
      "Ask me how audits work, what a report includes, or how to get started — " +
      "no account needed on the marketing site."
    )
  }

  return (
    "Hey — I'm Vertly, Convertly's AI Product Specialist.\n\n" +
    "I know audits, reports, your plan, billing, and workspace inside out. Ask me anything about Convertly."
  )
}
