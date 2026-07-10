import { useContext, useEffect } from "react"

import { VertlyContext } from "@/features/vertly/context/vertlyContext"
import type { VertlyPageContext } from "@/features/vertly/types"

function useVertly() {
  const context = useContext(VertlyContext)
  if (!context) {
    throw new Error("useVertly must be used within VertlyProvider")
  }
  return context
}

function useVertlyPageContext(context: Partial<VertlyPageContext> | null) {
  const { registerPageContext } = useVertly()
  const contextKey = context
    ? `${context.surface ?? ""}:${JSON.stringify(context.metadata ?? {})}:${context.title ?? ""}`
    : "null"

  useEffect(() => {
    registerPageContext(context)
    return () => registerPageContext(null)
  }, [context, contextKey, registerPageContext])
}

export { useVertly, useVertlyPageContext }
