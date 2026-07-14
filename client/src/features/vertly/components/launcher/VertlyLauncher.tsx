import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useRef, useState } from "react"

import { VertlyCompanionCharacter } from "@/features/vertly/components/launcher/VertlyCompanionCharacter"
import { VertlySpeechBubbleView } from "@/features/vertly/components/launcher/VertlySpeechBubble"
import { useVertlyIdleActions } from "@/features/vertly/hooks/useVertlyIdleActions"
import { VERTLY_LAUNCHER_TAP } from "@/features/vertly/motion/vertlyMotion"
import type { VertlyPosition, VertlySpeechBubble } from "@/features/vertly/types"
import { resolveVertlyBodyMode, resolveVertlyEyeState } from "@/features/vertly/utils/resolveEyeState"
import { resolveRobotPose } from "@/features/vertly/utils/resolveRobotPose"
import { emitVertlyInteraction } from "@/features/vertly/utils/vertlyInteraction"
import { playVertlyMicroSound } from "@/features/vertly/utils/vertlySound"
import { cn } from "@/lib/utils"

type VertlyLauncherProps = {
  position: VertlyPosition
  isOpen: boolean
  isDragging: boolean
  isTyping: boolean
  speechBubble: VertlySpeechBubble | null
  onDismissSpeechBubble: () => void
  onSpeechBubbleActivate: () => void
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void
  onClick: (event: React.MouseEvent<HTMLElement>) => void
}

function VertlyLauncher({
  position,
  isOpen,
  isDragging,
  isTyping,
  speechBubble,
  onDismissSpeechBubble,
  onSpeechBubbleActivate,
  onPointerDown,
  onClick,
}: VertlyLauncherProps) {
  const shouldReduceMotion = useReducedMotion()
  const launcherRef = useRef<HTMLButtonElement>(null)
  const prevOpenRef = useRef(isOpen)
  const [isHovered, setIsHovered] = useState(false)
  const [gaze, setGaze] = useState({ x: 0, y: 0 })
  const [interaction, setInteraction] = useState<"none" | "opening" | "closing">("none")

  const lifeAction = useVertlyIdleActions({
    enabled: !isOpen && interaction === "none" && !isDragging,
    isOpen,
    isDragging,
  })

  const displayLifeAction = interaction === "closing" ? "wave" : lifeAction

  const bodyMode = resolveVertlyBodyMode({
    isOpen,
    isDragging,
    isTyping,
    isHovered,
    interaction,
  })

  const eyeState = resolveVertlyEyeState({
    bodyMode,
    isHovered,
    hasSpeechBubble: Boolean(speechBubble),
    lifeAction: displayLifeAction,
    gazeX: gaze.x,
    gazeY: gaze.y,
  })

  const pose = resolveRobotPose(gaze, bodyMode, isHovered, Boolean(speechBubble), displayLifeAction)

  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setInteraction("opening")
      const timerId = window.setTimeout(() => setInteraction("none"), 520)
      prevOpenRef.current = isOpen
      return () => window.clearTimeout(timerId)
    }

    if (!isOpen && prevOpenRef.current) {
      setInteraction("closing")
      const timerId = window.setTimeout(() => setInteraction("none"), 720)
      prevOpenRef.current = isOpen
      return () => window.clearTimeout(timerId)
    }

    prevOpenRef.current = isOpen
  }, [isOpen])

  function handleMouseEnter() {
    setIsHovered(true)
    emitVertlyInteraction()
    playVertlyMicroSound("hover")
  }

  function handleMouseLeave() {
    setIsHovered(false)
    setGaze({ x: 0, y: 0 })
  }

  function handleMouseMove(event: React.MouseEvent<HTMLButtonElement>) {
    if (!isHovered || isDragging || shouldReduceMotion) return

    const rect = launcherRef.current?.getBoundingClientRect()
    if (!rect) return

    const headCenterX = rect.left + rect.width / 2
    const headCenterY = rect.top + rect.height * 0.32
    const offsetX = (event.clientX - headCenterX) / 12
    const offsetY = (event.clientY - headCenterY) / 14

    setGaze({
      x: Math.max(-3.5, Math.min(3.5, offsetX)),
      y: Math.max(-2.5, Math.min(2.5, offsetY)),
    })
  }

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    emitVertlyInteraction()
    onPointerDown(event)
  }

  function handleClick(event: React.MouseEvent<HTMLElement>) {
    emitVertlyInteraction()
    if (!isOpen) {
      playVertlyMicroSound("open")
    }
    onClick(event)
  }

  return (
    <div
      className={cn(
        "vertly-launcher-anchor",
        isOpen && "vertly-launcher-anchor--open",
        speechBubble && "vertly-launcher-anchor--speaking"
      )}
      style={{ left: position.x, top: position.y }}
    >
      <VertlySpeechBubbleView
        bubble={speechBubble}
        onDismiss={onDismissSpeechBubble}
        onActivate={onSpeechBubbleActivate}
      />

      <motion.button
        ref={launcherRef}
        type="button"
        className={cn(
          "vertly-launcher",
          isDragging && "vertly-launcher--dragging",
          isHovered && !isDragging && "vertly-launcher--hover",
          interaction === "opening" && "vertly-launcher--opening",
          interaction === "closing" && "vertly-launcher--closing"
        )}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        aria-label={isOpen ? "Close Vertly assistant" : "Open Vertly assistant"}
        aria-expanded={isOpen}
        whileTap={shouldReduceMotion || isDragging ? undefined : VERTLY_LAUNCHER_TAP}
      >
        <VertlyCompanionCharacter
          bodyMode={bodyMode}
          isDragging={isDragging}
          lifeAction={displayLifeAction}
          eyeState={eyeState}
          gazeX={gaze.x}
          gazeY={gaze.y}
          pose={pose}
        />
      </motion.button>
    </div>
  )
}

export { VertlyLauncher }
