import type { VertlyBodyMode, VertlyLifeAction } from "@/features/vertly/types"

type Gaze = { x: number; y: number }

type RobotPose = {
  headTilt: number
  bodyLean: number
  armLeft: number
  armRight: number
}

function resolveRobotPose(
  gaze: Gaze,
  bodyMode: VertlyBodyMode,
  isHovered: boolean,
  hasSpeechBubble: boolean,
  lifeAction: VertlyLifeAction = "idle"
): RobotPose {
  const curious = isHovered && bodyMode === "hover"
  const headTilt = hasSpeechBubble ? -5 : curious ? gaze.x * 1.15 : 0
  const bodyLean = curious ? gaze.x * 0.6 : 0
  const towardCursorL = curious ? gaze.x * 2.4 - gaze.y * 1.1 : 0
  const towardCursorR = curious ? gaze.x * 2.4 + gaze.y * 0.7 : 0

  if (
    lifeAction === "happy-blink" ||
    lifeAction === "bounce" ||
    lifeAction === "wave"
  ) {
    return {
      headTilt: headTilt || 2,
      bodyLean,
      armLeft: -30,
      armRight: lifeAction === "wave" ? -38 : -32,
    }
  }

  if (lifeAction === "shoulder") {
    return {
      headTilt,
      bodyLean,
      armLeft: -28,
      armRight: 26,
    }
  }

  switch (bodyMode) {
    case "hover":
      return {
        headTilt,
        bodyLean,
        armLeft: -28 + towardCursorL,
        armRight: 28 + towardCursorR,
      }
    case "thinking":
      return {
        headTilt: -3,
        bodyLean: -1.5,
        armLeft: -40,
        armRight: 12,
      }
    case "processing":
      return {
        headTilt: curious ? gaze.x * 0.6 : 0,
        bodyLean: curious ? gaze.x * 0.35 : 0,
        armLeft: -22 + towardCursorL * 0.4,
        armRight: 22 + towardCursorR * 0.4,
      }
    case "open":
    case "success":
    case "closing":
      return {
        headTilt: hasSpeechBubble ? -5 : 2,
        bodyLean: 0,
        armLeft: -34,
        armRight: -34,
      }
    case "error":
      return {
        headTilt: 4,
        bodyLean: 2,
        armLeft: -10,
        armRight: 10,
      }
    default:
      return {
        headTilt,
        bodyLean,
        armLeft: -24 + towardCursorL * 0.35,
        armRight: 24 + towardCursorR * 0.35,
      }
  }
}

export { resolveRobotPose }
export type { RobotPose }
