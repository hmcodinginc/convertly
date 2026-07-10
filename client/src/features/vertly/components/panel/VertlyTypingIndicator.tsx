import { useEffect, useState } from "react"

import { ConvertlyMarkAnimated } from "@/components/brand/ConvertlyMarkAnimated"
import { resolveVertlyLoadingPhrases } from "@/features/vertly/utils/vertlyLoadingCopy"
import type { VertlyPageContext } from "@/features/vertly/types"

type VertlyTypingIndicatorProps = {
  pageContext: VertlyPageContext
}

function VertlyTypingIndicator({ pageContext }: VertlyTypingIndicatorProps) {
  const phrases = resolveVertlyLoadingPhrases(pageContext)
  const [phraseIndex, setPhraseIndex] = useState(0)

  useEffect(() => {
    setPhraseIndex(0)
  }, [pageContext.surface, pageContext.title])

  useEffect(() => {
    if (phrases.length <= 1) return undefined

    const timerId = window.setInterval(() => {
      setPhraseIndex((current) => (current + 1) % phrases.length)
    }, 2400)

    return () => window.clearInterval(timerId)
  }, [phrases])

  const label = phrases[phraseIndex] ?? phrases[0] ?? "Thinking..."

  return (
    <div className="vertly-typing" role="status" aria-live="polite" aria-label={label}>
      <ConvertlyMarkAnimated size={28} variant="loading" className="vertly-typing__mark" />
      <p className="vertly-typing__copy">{label}</p>
    </div>
  )
}

export { VertlyTypingIndicator }
