import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import type { VertlyQuickAction, VertlySuggestion } from "@/features/vertly/types"
import { cn } from "@/lib/utils"

type VertlySuggestionsRailProps = {
  suggestions: VertlySuggestion[]
  relatedSuggestions: VertlySuggestion[]
  quickActions: VertlyQuickAction[]
  isTyping: boolean
  onSelectSuggestion: (prompt: string) => Promise<void>
  onClose: () => void
}

function VertlySuggestionsRail({
  suggestions,
  relatedSuggestions,
  quickActions,
  isTyping,
  onSelectSuggestion,
  onClose,
}: VertlySuggestionsRailProps) {
  const [expanded, setExpanded] = useState(true)

  const hasSuggestions = suggestions.length > 0
  const hasRelated = relatedSuggestions.length > 0
  const hasActions = quickActions.length > 0
  const hasContent = hasSuggestions || hasRelated || hasActions

  if (!hasContent) return null

  async function handleSelectSuggestion(prompt: string) {
    setExpanded(false)
    await onSelectSuggestion(prompt)
  }

  function handleCollapseRail() {
    setExpanded(false)
  }

  const summaryParts: string[] = []
  if (hasSuggestions) summaryParts.push(`${suggestions.length} suggested`)
  if (hasRelated) summaryParts.push(`${relatedSuggestions.length} related`)
  if (hasActions) summaryParts.push(`${quickActions.length} actions`)

  return (
    <div className={cn("vertly-rail", expanded && "vertly-rail--expanded")}>
      <button
        type="button"
        className="vertly-rail__toggle"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        <span className="vertly-rail__toggle-label">
          {expanded ? "Suggestions" : summaryParts.join(" · ")}
        </span>
        <ChevronDown className={cn("vertly-rail__chevron size-3.5", expanded && "vertly-rail__chevron--open")} />
      </button>

      {expanded ? (
        <div className="vertly-rail__body">
          {hasSuggestions ? (
            <section className="vertly-rail__section">
              <p className="vertly-rail__heading">Suggested Questions</p>
              <div className="vertly-rail__chips">
                {suggestions.map((suggestion) => (
                  <SuggestionChip
                    key={suggestion.id}
                    suggestion={suggestion}
                    disabled={isTyping}
                    onSelect={handleSelectSuggestion}
                    onCollapse={handleCollapseRail}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {hasRelated ? (
            <section className={cn("vertly-rail__section", isTyping && "vertly-rail__section--refreshing")}>
              <p className="vertly-rail__heading">Related Questions</p>
              <div className="vertly-rail__chips">
                {relatedSuggestions.map((suggestion) => (
                  <SuggestionChip
                    key={suggestion.id}
                    suggestion={suggestion}
                    disabled={isTyping}
                    variant="related"
                    onSelect={handleSelectSuggestion}
                    onCollapse={handleCollapseRail}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {hasActions ? (
            <section className="vertly-rail__section">
              <p className="vertly-rail__heading">Quick Actions</p>
              <div className="vertly-rail__actions">
                {quickActions.map((action) => (
                  <Link
                    key={action.id}
                    to={action.href}
                    className="vertly-quick-action"
                    onClick={onClose}
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function SuggestionChip({
  suggestion,
  disabled,
  variant = "default",
  onSelect,
  onCollapse,
}: {
  suggestion: VertlySuggestion
  disabled: boolean
  variant?: "default" | "related"
  onSelect: (prompt: string) => Promise<void>
  onCollapse?: () => void
}) {
  if (suggestion.href) {
    return (
      <Link
        to={suggestion.href}
        className={cn("vertly-chip", variant === "related" && "vertly-chip--related")}
        onClick={onCollapse}
      >
        {suggestion.label}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={cn("vertly-chip", variant === "related" && "vertly-chip--related")}
      disabled={disabled}
      onClick={() => void onSelect(suggestion.prompt ?? suggestion.label)}
    >
      {suggestion.label}
    </button>
  )
}

export { VertlySuggestionsRail }
