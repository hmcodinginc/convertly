import { handleAuditExpertRoute } from "@/features/vertly/routing/handlers/auditExpertHandler"
import { handleBillingRoute } from "@/features/vertly/routing/handlers/billingHandler"
import { handleDashboardRoute } from "@/features/vertly/routing/handlers/dashboardHandler"
import { handleGreetingRoute } from "@/features/vertly/routing/handlers/greetingHandler"
import { handleOutOfScopeRoute } from "@/features/vertly/routing/handlers/outOfScopeHandler"
import { handleProductRoute } from "@/features/vertly/routing/handlers/productMemoryHandler"
import { handleRefusalRoute } from "@/features/vertly/routing/handlers/refusalHandler"
import { handleUserStateRoute } from "@/features/vertly/routing/handlers/userStateHandler"
import { handleWorkspaceRoute } from "@/features/vertly/routing/handlers/workspaceHandler"
import type {
  VertlyConversationRequest,
  VertlyConversationResponse,
  VertlyDomain,
  VertlyRoutingResult,
} from "@/features/vertly/types"

/**
 * Local handler provider — today's response engine.
 * Future: swap for HX AI, Ollama, OpenAI, or Claude without changing routing.
 */
export type VertlyResponseProvider = {
  respond: (
    request: VertlyConversationRequest,
    routing: VertlyRoutingResult
  ) => VertlyConversationResponse
}

function routeInScopeDomain(
  request: VertlyConversationRequest,
  routing: VertlyRoutingResult
): VertlyConversationResponse {
  const domain = routing.domain ?? "product"

  switch (domain) {
    case "account":
      return handleUserStateRoute(request)
    case "billing":
      return handleBillingRoute(request, routing)
    case "workspace":
      return handleWorkspaceRoute(request, routing)
    case "audit":
    case "report":
      return handleAuditExpertRoute(request, routing)
    case "dashboard":
      return handleDashboardRoute(request, routing)
    case "settings":
      return handleProductRoute(request)
    case "product":
    default:
      return handleProductRoute(request)
  }
}

export const localVertlyProvider: VertlyResponseProvider = {
  respond(request, routing) {
    switch (routing.scope) {
      case "refusal":
        return handleRefusalRoute(request)
      case "greeting":
        return handleGreetingRoute(request)
      case "out_of_scope":
        return handleOutOfScopeRoute(request)
      case "in_scope":
        return routeInScopeDomain(request, routing)
      default:
        return handleOutOfScopeRoute(request)
    }
  },
}
