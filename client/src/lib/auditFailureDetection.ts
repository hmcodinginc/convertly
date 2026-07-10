export function isBotProtectionFailure(message?: string | null): boolean {
  if (!message) return false

  const normalized = message.toLowerCase()

  return (
    normalized.includes("bot protection") ||
    normalized.includes("cloudflare") ||
    normalized.includes("blocked automated access") ||
    normalized.includes("human verification") ||
    normalized.includes("checking your browser")
  )
}
