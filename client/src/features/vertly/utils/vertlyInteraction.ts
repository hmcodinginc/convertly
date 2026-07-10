export const VERTLY_INTERACTION_EVENT = "vertly:user-interaction"

export function emitVertlyInteraction(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(VERTLY_INTERACTION_EVENT))
}

export function subscribeVertlyInteraction(onInteraction: () => void): () => void {
  if (typeof window === "undefined") return () => undefined

  window.addEventListener(VERTLY_INTERACTION_EVENT, onInteraction)
  return () => window.removeEventListener(VERTLY_INTERACTION_EVENT, onInteraction)
}
