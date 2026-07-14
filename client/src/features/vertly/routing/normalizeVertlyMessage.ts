/**
 * Normalizes user input for Vertly classification.
 * trim → collapse whitespace → lowercase → strip trailing punctuation
 */
export function normalizeVertlyMessage(message: string): string {
  return message
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[!?.…,;:]+$/g, "")
    .trim()
}

const GREETING_EXACT = new Set([
  "hi",
  "hello",
  "hey",
  "yo",
  "sup",
  "howdy",
  "how are you",
  "what's up",
  "whats up",
  "how's it going",
  "hows it going",
  "good morning",
  "good afternoon",
  "good evening",
  "greetings",
  "salutations",
])

export function isVertlyGreeting(message: string): boolean {
  const normalized = normalizeVertlyMessage(message)
  if (GREETING_EXACT.has(normalized)) return true
  if (/^good (morning|afternoon|evening)$/.test(normalized)) return true
  if (/^(hi|hello|hey|yo|sup|howdy)$/.test(normalized)) return true
  if (normalized.length <= 20 && /^(hi|hello|hey)\b/.test(normalized)) return true
  return false
}

export function isVertlyIdentityQuestion(message: string): boolean {
  const normalized = normalizeVertlyMessage(message)
  return (
    normalized === "who are you" ||
    normalized === "what are you" ||
    normalized === "what is your job" ||
    normalized === "what do you do" ||
    normalized === "what is vertly" ||
    normalized === "who is vertly" ||
    normalized === "tell me about yourself"
  )
}
