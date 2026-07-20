import type { VertlyMessage } from "@/features/vertly/types"

/**
 * In-memory guest Vertly history for the current browser page session.
 * Survives SPA navigation (marketing ↔ auth) while the tab stays open.
 * Clears on full refresh / tab close — never written to localStorage or Supabase.
 */
let guestSessionMessages: VertlyMessage[] = []

export function readGuestSessionMessages(): VertlyMessage[] {
  return guestSessionMessages
}

export function writeGuestSessionMessages(messages: VertlyMessage[]): void {
  guestSessionMessages = messages.slice(-40)
}

export function clearGuestSessionMessages(): void {
  guestSessionMessages = []
}

/** Read and clear guest messages (used when migrating into an authenticated account). */
export function takeGuestSessionMessages(): VertlyMessage[] {
  const messages = guestSessionMessages
  guestSessionMessages = []
  return messages
}

export function mergeVertlyHistories(
  existing: VertlyMessage[],
  incoming: VertlyMessage[]
): VertlyMessage[] {
  if (incoming.length === 0) return existing.slice(-40)
  if (existing.length === 0) return incoming.slice(-40)

  const seen = new Set(existing.map((message) => message.id))
  const appended = incoming.filter((message) => !seen.has(message.id))
  return [...existing, ...appended].slice(-40)
}
