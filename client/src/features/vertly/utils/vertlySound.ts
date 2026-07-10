export type VertlySoundEvent = "hover" | "open" | "bubble" | "celebrate"

/**
 * Placeholder for future Vertly micro-sounds.
 * Intentionally silent unless explicitly enabled later.
 */
export function playVertlyMicroSound(_event: VertlySoundEvent): void {
  if (import.meta.env.VITE_VERTLY_SOUND !== "true") return
  // Audio hook reserved for a future premium sound pack.
}
