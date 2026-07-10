export const VERTLY_IDLE_HELP_PROMPTS = [
  "Need help?",
  "Want me to explain this page?",
  "I noticed something.",
] as const

export function pickIdleHelpPrompt(): string {
  const index = Math.floor(Math.random() * VERTLY_IDLE_HELP_PROMPTS.length)
  return VERTLY_IDLE_HELP_PROMPTS[index] ?? VERTLY_IDLE_HELP_PROMPTS[0]
}

export const VERTLY_IDLE_HELP_MIN_GAP_MS = 2 * 60 * 1000
export const VERTLY_IDLE_QUIET_MS = 20 * 1000
export const VERTLY_IDLE_CHECK_MIN_MS = 20 * 1000
export const VERTLY_IDLE_CHECK_MAX_MS = 30 * 1000
export const VERTLY_IDLE_BUBBLE_MS = 5000
