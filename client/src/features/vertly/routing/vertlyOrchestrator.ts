import { classifyVertlyDomain } from "@/features/vertly/routing/domainClassifier"
import { detectVertlyScope } from "@/features/vertly/routing/scopeDetector"
import { classifyVertlySubtopic } from "@/features/vertly/routing/subtopicClassifier"
import { localVertlyProvider } from "@/features/vertly/routing/vertlyProvider"
import type {
  VertlyConversationRequest,
  VertlyConversationResponse,
  VertlyRoutingResult,
  VertlySubtopic,
} from "@/features/vertly/types"

const SUBTOPIC_DOMAINS = new Set(["dashboard", "workspace", "billing", "audit", "report"])

export function resolveVertlyRouting(request: VertlyConversationRequest): VertlyRoutingResult {
  const scopeResult = detectVertlyScope(request.message)

  if (scopeResult.scope !== "in_scope") {
    return {
      scope: scopeResult.scope,
      confidence: scopeResult.confidence,
    }
  }

  const domainResult = classifyVertlyDomain(request.message, request.context)
  const subtopic: VertlySubtopic | null = SUBTOPIC_DOMAINS.has(domainResult.domain)
    ? classifyVertlySubtopic(request.message, domainResult.domain)
    : null

  return {
    scope: "in_scope",
    domain: domainResult.domain,
    subtopic,
    confidence: domainResult.confidence,
  }
}

export function routeVertlyResponse(
  request: VertlyConversationRequest
): VertlyConversationResponse {
  const routing = resolveVertlyRouting(request)
  return localVertlyProvider.respond(request, routing)
}
