import type { Recommendation, RecommendationPlaybook } from "@/types/audit"
import type { VertlyPageContext, VertlySuggestion } from "@/features/vertly/types"

function buildPlaybookSuggestions(
  playbook: RecommendationPlaybook,
  hasExampleCode: boolean
): VertlySuggestion[] {
  const title = playbook.title
  const suggestions: VertlySuggestion[] = [
    {
      id: "pb-explain",
      label: "Explain this recommendation",
      prompt: `Explain the recommendation "${title}" and what problem it solves.`,
    },
    {
      id: "pb-priority",
      label: `Why is this ${playbook.priority} priority?`,
      prompt: `Why is "${title}" marked as ${playbook.priority} priority?`,
    },
    {
      id: "pb-impl",
      label: "Show implementation example",
      prompt: `Walk me through implementing "${title}" with concrete steps.`,
    },
    {
      id: "pb-compare",
      label: "Compare with another recommendation",
      prompt: `Compare "${title}" with other recommendations from this audit. Which should I tackle first?`,
    },
    {
      id: "pb-first",
      label: "What should I fix first?",
      prompt: "What should I fix first on this audit based on priority and expected impact?",
    },
  ]

  if (hasExampleCode) {
    suggestions.push({
      id: "pb-code",
      label: "Show code snippet",
      prompt: `Show me a code snippet for implementing "${title}".`,
    })
  }

  return suggestions
}

function buildPlaybookRelatedSuggestions(
  playbook: RecommendationPlaybook
): VertlySuggestion[] {
  return [
    {
      id: "pb-rel-impact",
      label: "Expected improvement",
      prompt: `What improvement should I expect from "${playbook.title}"?`,
    },
    {
      id: "pb-rel-time",
      label: "Time to implement",
      prompt: `How long should "${playbook.title}" take to implement (${playbook.estimatedTime})?`,
    },
    {
      id: "pb-rel-checklist",
      label: "Review checklist",
      prompt: `Help me work through the implementation checklist for "${playbook.title}".`,
    },
  ]
}

function buildPlaybookVertlyContext(
  playbook: RecommendationPlaybook,
  recommendation: Recommendation,
  domain?: string
): Partial<VertlyPageContext> {
  const hasExampleCode = Boolean(playbook.exampleCode)

  return {
    surface: "recommendation-playbook",
    title: playbook.title,
    description: `Reviewing ${recommendation.category} recommendation`,
    suggestions: buildPlaybookSuggestions(playbook, hasExampleCode),
    quickActions: [],
    metadata: {
      ruleId: playbook.ruleId,
      severity: playbook.priority,
      difficulty: playbook.difficultyLabel,
      estimatedTime: playbook.estimatedTime,
      expectedImprovement: playbook.expectedImprovement,
      domain: domain ?? null,
      recommendationId: playbook.recommendationId,
      category: recommendation.category,
    },
  }
}

function buildPlaybookRelatedFromContext(context: VertlyPageContext): VertlySuggestion[] {
  const title = context.title
  const estimatedTime =
    typeof context.metadata?.estimatedTime === "string"
      ? context.metadata.estimatedTime
      : "the estimated time"

  return [
    {
      id: "pb-rel-impact",
      label: "Expected improvement",
      prompt: `What improvement should I expect from "${title}"?`,
    },
    {
      id: "pb-rel-time",
      label: "Time to implement",
      prompt: `How long should "${title}" take to implement (${estimatedTime})?`,
    },
    {
      id: "pb-rel-checklist",
      label: "Review checklist",
      prompt: `Help me work through the implementation checklist for "${title}".`,
    },
  ]
}

export {
  buildPlaybookRelatedFromContext,
  buildPlaybookRelatedSuggestions,
  buildPlaybookSuggestions,
  buildPlaybookVertlyContext,
}
