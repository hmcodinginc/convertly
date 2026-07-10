import {
  buildRecommendationPlaybook,
  type PlaybookBuildInput,
} from "@/services/audit/playbooks/buildRecommendationPlaybook"
import type { RecommendationPlaybook } from "@/types/audit"

function getRecommendationPlaybook(
  recommendationId: string,
  options: Omit<PlaybookBuildInput, "recommendationId"> = {}
): RecommendationPlaybook {
  return buildRecommendationPlaybook({
    recommendationId,
    ...options,
  })
}

export { getRecommendationPlaybook }
