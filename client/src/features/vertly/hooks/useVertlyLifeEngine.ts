import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"

import {
  VERTLY_IDLE_BUBBLE_MS,
  VERTLY_IDLE_HELP_MIN_GAP_MS,
  VERTLY_IDLE_QUIET_MS,
  pickIdleHelpPrompt,
} from "@/features/vertly/content/idleHelpPrompts"
import { AUTH_VERTLY_GREETINGS } from "@/features/vertly/content/authPageContexts"
import { isAuditCompleted, VERTLY_MILESTONE_MESSAGES } from "@/features/vertly/content/lifeMoments"
import { peekPremiumActivation } from "@/lib/premiumWelcomePersistence"
import {
  hasShownAuditFinishedBubble,
  hasVertlyMilestone,
  markAuditFinishedBubbleShown,
  markVertlyMilestone,
} from "@/features/vertly/services/vertlyLifePersistence"
import type {
  VertlyMilestoneId,
  VertlyPageContext,
  VertlySpeechBubble,
  VertlyVariant,
} from "@/features/vertly/types"
import { subscribeVertlyInteraction } from "@/features/vertly/utils/vertlyInteraction"
import { playVertlyMicroSound } from "@/features/vertly/utils/vertlySound"

type UseVertlyLifeEngineOptions = {
  userKey: string
  variant: VertlyVariant
  isOpen: boolean
  pageContext: VertlyPageContext
  unreadCount: number
}

function randomBetween(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min))
}

function useVertlyLifeEngine({
  userKey,
  variant,
  isOpen,
  pageContext,
  unreadCount,
}: UseVertlyLifeEngineOptions) {
  const [speechBubble, setSpeechBubble] = useState<VertlySpeechBubble | null>(null)
  const dismissTimerRef = useRef<number | null>(null)
  const idleHelpTimerRef = useRef<number | null>(null)
  const prevUnreadRef = useRef(unreadCount)
  const lastInteractionRef = useRef(Date.now())
  const lastIdleBubbleRef = useRef(0)
  const speechBubbleRef = useRef<VertlySpeechBubble | null>(null)
  const location = useLocation()

  speechBubbleRef.current = speechBubble

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current != null) {
      window.clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }
  }, [])

  const dismissSpeechBubble = useCallback(() => {
    clearDismissTimer()
    setSpeechBubble(null)
  }, [clearDismissTimer])

  const markInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now()
  }, [])

  const showSpeechBubble = useCallback(
    (bubble: Omit<VertlySpeechBubble, "id">) => {
      if (isOpen) return

      clearDismissTimer()
      const next: VertlySpeechBubble = {
        id: `bubble-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        autoDismissMs: bubble.autoDismissMs ?? 4800,
        ...bubble,
      }

      setSpeechBubble(next)
      dismissTimerRef.current = window.setTimeout(() => {
        setSpeechBubble(null)
        dismissTimerRef.current = null
      }, next.autoDismissMs)
    },
    [clearDismissTimer, isOpen]
  )

  const showMilestone = useCallback(
    (milestoneId: VertlyMilestoneId) => {
      if (hasVertlyMilestone(userKey, milestoneId)) return false
      markVertlyMilestone(userKey, milestoneId)

      const copy = VERTLY_MILESTONE_MESSAGES[milestoneId]
      showSpeechBubble({
        message: copy.message,
        opensPanel: copy.opensPanel,
        autoDismissMs: milestoneId === "first-login" ? 5500 : 6200,
      })
      if (milestoneId === "first-audit" || milestoneId === "first-upgrade") {
        playVertlyMicroSound("celebrate")
      } else if (milestoneId === "first-login") {
        playVertlyMicroSound("bubble")
      }
      return true
    },
    [showSpeechBubble, userKey]
  )

  useEffect(() => subscribeVertlyInteraction(markInteraction), [markInteraction])

  useEffect(() => {
    const onActivity = () => markInteraction()
    const opts: AddEventListenerOptions = { passive: true, capture: true }

    window.addEventListener("pointerdown", onActivity, opts)
    window.addEventListener("keydown", onActivity, opts)
    window.addEventListener("scroll", onActivity, opts)

    return () => {
      window.removeEventListener("pointerdown", onActivity, opts)
      window.removeEventListener("keydown", onActivity, opts)
      window.removeEventListener("scroll", onActivity, opts)
    }
  }, [markInteraction])

  useEffect(() => {
    if (isOpen) markInteraction()
  }, [isOpen, markInteraction])

  useEffect(() => {
    if (variant !== "guest-auth") return

    const message = AUTH_VERTLY_GREETINGS[location.pathname]
    if (!message) return

    const storageKey = `convertly.vertly.auth-greet.${location.pathname}`
    try {
      if (sessionStorage.getItem(storageKey) === "1") return
      sessionStorage.setItem(storageKey, "1")
    } catch {
      /* storage unavailable */
    }

    const timer = window.setTimeout(() => {
      showSpeechBubble({
        message,
        autoDismissMs: 5500,
      })
    }, 1400)

    return () => window.clearTimeout(timer)
  }, [location.pathname, showSpeechBubble, variant])

  useEffect(() => {
    if (variant !== "authenticated" || !userKey || userKey === "guest") return
    showMilestone("first-login")
  }, [showMilestone, userKey, variant])

  useEffect(() => {
    if (variant !== "authenticated" || isOpen) return
    const activation = peekPremiumActivation()
    if (activation) showMilestone("first-upgrade")
  }, [isOpen, showMilestone, variant, pageContext.surface])

  useEffect(() => {
    if (variant !== "authenticated" || isOpen) return
    if (pageContext.surface !== "billing" && pageContext.surface !== "billing-return") return
    showMilestone("first-billing")
  }, [isOpen, pageContext.surface, showMilestone, variant])

  useEffect(() => {
    if (variant !== "authenticated" || isOpen) return
    if (pageContext.surface !== "audit-detail") return

    const status = pageContext.metadata?.status
    const auditId = pageContext.metadata?.auditId
    if (!isAuditCompleted(status) || typeof auditId !== "string") return

    if (!hasVertlyMilestone(userKey, "first-audit")) {
      showMilestone("first-audit")
      markAuditFinishedBubbleShown(auditId)
      return
    }

    if (!hasShownAuditFinishedBubble(auditId)) {
      markAuditFinishedBubbleShown(auditId)
      showSpeechBubble({
        message: "Audit finished.",
        opensPanel: true,
        autoDismissMs: 5000,
      })
    }
  }, [
    isOpen,
    pageContext.metadata?.auditId,
    pageContext.metadata?.status,
    pageContext.surface,
    showMilestone,
    showSpeechBubble,
    userKey,
    variant,
  ])

  useEffect(() => {
    if (idleHelpTimerRef.current != null) {
      window.clearTimeout(idleHelpTimerRef.current)
      idleHelpTimerRef.current = null
    }

    if (isOpen || variant === "signup" || variant === "guest-auth") return

    function scheduleIdleHelp() {
      const now = Date.now()
      const quietFor = now - lastInteractionRef.current
      const sinceLastBubble = now - lastIdleBubbleRef.current
      const untilQuiet = Math.max(0, VERTLY_IDLE_QUIET_MS - quietFor)
      const untilGap = Math.max(0, VERTLY_IDLE_HELP_MIN_GAP_MS - sinceLastBubble)
      const checkDelay = Math.max(untilQuiet, untilGap) + randomBetween(800, 2800)

      idleHelpTimerRef.current = window.setTimeout(() => {
        const checkNow = Date.now()
        const quietForNow = checkNow - lastInteractionRef.current
        const sinceLastBubbleNow = checkNow - lastIdleBubbleRef.current

        if (
          !isOpen &&
          !speechBubbleRef.current &&
          quietForNow >= VERTLY_IDLE_QUIET_MS &&
          sinceLastBubbleNow >= VERTLY_IDLE_HELP_MIN_GAP_MS
        ) {
          lastIdleBubbleRef.current = checkNow
          showSpeechBubble({
            message: pickIdleHelpPrompt(),
            opensPanel: true,
            autoDismissMs: VERTLY_IDLE_BUBBLE_MS,
          })
        }

        scheduleIdleHelp()
      }, checkDelay)
    }

    scheduleIdleHelp()

    return () => {
      if (idleHelpTimerRef.current != null) {
        window.clearTimeout(idleHelpTimerRef.current)
        idleHelpTimerRef.current = null
      }
    }
  }, [isOpen, location.pathname, showSpeechBubble, variant])

  useEffect(() => {
    if (unreadCount > prevUnreadRef.current && !isOpen) {
      markInteraction()
      showSpeechBubble({
        message: "I found something.",
        opensPanel: true,
        autoDismissMs: 5200,
      })
    }
    prevUnreadRef.current = unreadCount
  }, [isOpen, markInteraction, showSpeechBubble, unreadCount])

  useEffect(() => {
    if (isOpen) dismissSpeechBubble()
  }, [dismissSpeechBubble, isOpen])

  useEffect(() => {
    return () => {
      clearDismissTimer()
      if (idleHelpTimerRef.current != null) window.clearTimeout(idleHelpTimerRef.current)
    }
  }, [clearDismissTimer])

  return {
    speechBubble,
    showSpeechBubble,
    dismissSpeechBubble,
  }
}

export { useVertlyLifeEngine }
