import { ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import type { VertlySuggestion } from "@/features/vertly/types"
import { cn } from "@/lib/utils"

type VertlySuggestionsRailProps = {
  suggestions: VertlySuggestion[]
  isTyping: boolean
  forceCollapsed?: boolean
  onSelectSuggestion: (prompt: string) => Promise<void>
}

function VertlySuggestionsRail({
  suggestions,
  isTyping,
  forceCollapsed = false,
  onSelectSuggestion,
}: VertlySuggestionsRailProps) {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (forceCollapsed) {
      setExpanded(false)
    }
  }, [forceCollapsed])

  async function handleSelectSuggestion(prompt: string) {
    setExpanded(false)
    await onSelectSuggestion(prompt)
  }

  function handleCollapseRail() {
    setExpanded(false)
  }

  const summaryParts: string[] = []
  if (suggestions.length > 0) summaryParts.push(`${suggestions.length} suggested`)
  if (summaryParts.length === 0) summaryParts.push("Suggestions")

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
          <section className="vertly-rail__section">
            <p className="vertly-rail__heading">Suggested Questions</p>
            {suggestions.length > 0 ? (
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
            ) : (
              <p className="vertly-rail__empty">No suggested questions for this page.</p>
            )}
          </section>
        </div>
      ) : null}
    </div>
  )
}

function SuggestionChip({
  suggestion,
  disabled,
  onSelect,
  onCollapse,
}: {
  suggestion: VertlySuggestion
  disabled: boolean
  onSelect: (prompt: string) => Promise<void>
  onCollapse?: () => void
}) {
  if (suggestion.href) {
    return (
      <Link
        to={suggestion.href}
        className="vertly-chip"
        onClick={onCollapse}
      >
        {suggestion.label}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className="vertly-chip"
      disabled={disabled}
      onClick={() => void onSelect(suggestion.prompt ?? suggestion.label)}
    >
      {suggestion.label}
    </button>
  )
}

export { VertlySuggestionsRail }
