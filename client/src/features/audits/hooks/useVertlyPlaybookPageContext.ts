import { useMemo } from "react"

import { buildPlaybookVertlyContext } from "@/features/vertly/content/playbookPageContext"
import { useVertlyPageContext } from "@/features/vertly/hooks/useVertly"
import type { Recommendation, RecommendationPlaybook } from "@/types/audit"

type UseVertlyPlaybookPageContextOptions = {
  open: boolean
  playbook: RecommendationPlaybook | null
  recommendation: Recommendation | null
  domain?: string
}

function useVertlyPlaybookPageContext({
  open,
  playbook,
  recommendation,
  domain,
}: UseVertlyPlaybookPageContextOptions) {
  const vertlyContext = useMemo(() => {
    if (!open || !playbook || !recommendation) return null
    return buildPlaybookVertlyContext(playbook, recommendation, domain)
  }, [domain, open, playbook, recommendation])

  useVertlyPageContext(vertlyContext)
}

export { useVertlyPlaybookPageContext }
