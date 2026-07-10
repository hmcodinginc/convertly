import { useCallback, useState } from "react"

import { playbookFromRecommendation } from "@/services/audit/playbooks/buildRecommendationPlaybook"
import type { Recommendation, RecommendationPlaybook } from "@/types/audit"

type ActivePlaybook = {
  recommendation: Recommendation
  playbook: RecommendationPlaybook
}

function useRecommendationPlaybook() {
  const [activePlaybook, setActivePlaybook] = useState<ActivePlaybook | null>(null)
  const [loadingPlaybookId, setLoadingPlaybookId] = useState<string | null>(null)

  const openPlaybook = useCallback(async (recommendation: Recommendation) => {
    setLoadingPlaybookId(recommendation.id)
    try {
      const playbook = playbookFromRecommendation(recommendation)
      setActivePlaybook({ recommendation, playbook })
    } finally {
      setLoadingPlaybookId(null)
    }
  }, [])

  const closePlaybook = useCallback(() => {
    setActivePlaybook(null)
  }, [])

  return {
    activePlaybook,
    loadingPlaybookId,
    openPlaybook,
    closePlaybook,
  }
}

export { useRecommendationPlaybook }
