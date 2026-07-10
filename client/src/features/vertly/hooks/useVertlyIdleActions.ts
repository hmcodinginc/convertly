import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"

import type { VertlyLifeAction } from "@/features/vertly/types"

const IDLE_ACTIONS: VertlyLifeAction[] = [
  "look-left",
  "look-right",
  "blink",
  "happy-blink",
  "tilt-left",
  "tilt-right",
  "bounce",
  "rotate",
  "wave",
  "shoulder",
]

const ACTION_DURATION_MS = 1400
const MIN_IDLE_DELAY_MS = 12000
const MAX_IDLE_DELAY_MS = 24000
const RECENT_ACTIONS_MAX = 3

function randomBetween(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min))
}

function pickIdleAction(recent: VertlyLifeAction[]): VertlyLifeAction {
  const pool = IDLE_ACTIONS.filter((action) => !recent.includes(action))
  const choices = pool.length > 0 ? pool : IDLE_ACTIONS
  return choices[Math.floor(Math.random() * choices.length)] ?? "blink"
}

function useVertlyIdleActions(options: {
  enabled: boolean
  isOpen: boolean
  isDragging: boolean
}) {
  const shouldReduceMotion = useReducedMotion()
  const [lifeAction, setLifeAction] = useState<VertlyLifeAction>("idle")
  const timersRef = useRef<number[]>([])
  const recentActionsRef = useRef<VertlyLifeAction[]>([])

  useEffect(() => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    timersRef.current = []

    if (shouldReduceMotion || !options.enabled || options.isOpen || options.isDragging) {
      setLifeAction("idle")
      return
    }

    function scheduleNext() {
      const delay = randomBetween(MIN_IDLE_DELAY_MS, MAX_IDLE_DELAY_MS)
      const scheduleId = window.setTimeout(() => {
        const action = pickIdleAction(recentActionsRef.current)
        recentActionsRef.current = [action, ...recentActionsRef.current].slice(0, RECENT_ACTIONS_MAX)
        setLifeAction(action)

        const resetId = window.setTimeout(() => {
          setLifeAction("idle")
          scheduleNext()
        }, ACTION_DURATION_MS)

        timersRef.current.push(resetId)
      }, delay)

      timersRef.current.push(scheduleId)
    }

    scheduleNext()

    return () => {
      timersRef.current.forEach((timerId) => window.clearTimeout(timerId))
      timersRef.current = []
    }
  }, [options.enabled, options.isDragging, options.isOpen, shouldReduceMotion])

  return lifeAction
}

export { useVertlyIdleActions }
