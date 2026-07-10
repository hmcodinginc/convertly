import type { VertlyBodyMode, VertlyEyeState, VertlyLifeAction } from "@/features/vertly/types"

type ResolveEyeStateInput = {
  bodyMode: VertlyBodyMode
  isHovered: boolean
  hasSpeechBubble: boolean
  lifeAction: VertlyLifeAction
  gazeX: number
  gazeY: number
}

function resolveVertlyEyeState({
  bodyMode,
  isHovered,
  hasSpeechBubble,
  lifeAction,
  gazeX,
  gazeY,
}: ResolveEyeStateInput): VertlyEyeState {
  if (hasSpeechBubble) return "look-up"
  if (bodyMode === "processing") return "processing"
  if (bodyMode === "thinking") return "thinking"
  if (bodyMode === "open" || bodyMode === "success" || bodyMode === "closing") return "happy"
  if (bodyMode === "error") return "look-down"
  if (bodyMode === "hover" || isHovered) {
    if (Math.abs(gazeX) > 1.5) return gazeX < 0 ? "look-left" : "look-right"
    if (gazeY < -0.8) return "look-up"
    if (gazeY > 0.8) return "look-down"
    return "curious"
  }
  if (lifeAction === "look-left") return "look-left"
  if (lifeAction === "look-right") return "look-right"
  if (lifeAction === "happy-blink" || lifeAction === "bounce" || lifeAction === "wave") {
    return "happy"
  }
  if (lifeAction === "blink") return "sleepy"
  return "idle"
}

function resolveVertlyBodyMode(input: {
  isOpen: boolean
  isDragging: boolean
  isTyping: boolean
  isHovered: boolean
  interaction: "none" | "opening" | "closing"
}): VertlyBodyMode {
  if (input.interaction === "opening") return "success"
  if (input.interaction === "closing") return "closing"
  if (input.isTyping) return "processing"
  if (input.isDragging) return "thinking"
  if (input.isOpen) return "open"
  if (input.isHovered) return "hover"
  return "idle"
}

export { resolveVertlyEyeState, resolveVertlyBodyMode }
