import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useLocation } from "react-router-dom"

import { VertlyContext } from "@/features/vertly/context/vertlyContext"
import { resolveGuestAuthContext } from "@/features/vertly/content/authPageContexts"
import { resolveMarketingContext } from "@/features/vertly/content/marketingPageContexts"
import { resolveRouteContext, SIGNUP_CONTEXT } from "@/features/vertly/content/pageContexts"
import { useVertlyLifeEngine } from "@/features/vertly/hooks/useVertlyLifeEngine"
import {
  getSignupWelcomeMessage,
  requestVertlyResponse,
} from "@/features/vertly/services/vertlyConversationService"
import { buildVertlyEnrichedContext } from "@/features/vertly/routing/vertlyContextBuilder"
import {
  dismissProactive,
  getVertlyUserKey,
  hasSeenSignupWelcome,
  isProactiveDismissed,
  markSignupWelcomeSeen,
  clearVertlyHistory,
  readVertlyPosition,
  writeVertlyPosition,
} from "@/features/vertly/services/vertlyPersistence"
import {
  mergeVertlyHistories,
  readGuestSessionMessages,
  takeGuestSessionMessages,
  writeGuestSessionMessages,
} from "@/features/vertly/services/vertlyGuestSession"
import {
  readVertlyConversation,
  writeVertlyConversation,
} from "@/features/vertly/services/vertlyConversationRepository"
import type {
  VertlyMessage,
  VertlyPageContext,
  VertlyPosition,
  VertlyVariant,
} from "@/features/vertly/types"
import {
  clampVertlyPosition,
  getDefaultPosition,
  snapFromEdges,
} from "@/features/vertly/utils/position"

type VertlyProviderProps = {
  children?: ReactNode
  variant?: VertlyVariant
  userId?: string
  autoOpenSignupWelcome?: boolean
}

function createMessage(role: VertlyMessage["role"], content: string): VertlyMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: Date.now(),
  }
}

function mergePageContext(
  base: VertlyPageContext,
  override: Partial<VertlyPageContext> | null
): VertlyPageContext {
  if (!override) return base
  return {
    ...base,
    ...override,
    metadata: { ...base.metadata, ...override.metadata },
    auditContext: override.auditContext ?? base.auditContext,
    suggestions:
      override.suggestions && override.suggestions.length > 0
        ? override.suggestions
        : base.suggestions,
    quickActions:
      override.quickActions && override.quickActions.length > 0
        ? override.quickActions
        : base.quickActions,
    proactive: override.proactive ?? base.proactive,
  }
}

function isGuestVariant(variant: VertlyVariant): boolean {
  return variant === "marketing" || variant === "guest-auth" || variant === "signup"
}

function VertlyProvider({
  children,
  variant = "authenticated",
  userId,
  autoOpenSignupWelcome = false,
}: VertlyProviderProps) {
  const location = useLocation()
  const userKey = getVertlyUserKey(userId)
  const shouldUseRemoteHistory = variant === "authenticated" && Boolean(userId?.trim())
  const guestMode = isGuestVariant(variant)
  const routeContext = useMemo(() => {
    if (variant === "signup") return SIGNUP_CONTEXT
    if (variant === "guest-auth") return resolveGuestAuthContext(location.pathname)
    if (variant === "marketing") return resolveMarketingContext(location.pathname)
    return resolveRouteContext(location.pathname)
  }, [location.pathname, variant])

  const [pageOverride, setPageOverride] = useState<Partial<VertlyPageContext> | null>(
    null
  )
  const [messages, setMessages] = useState<VertlyMessage[]>(() =>
    guestMode ? readGuestSessionMessages() : []
  )
  const [isOpen, setIsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showProactive, setShowProactive] = useState(false)
  const [historyReady, setHistoryReady] = useState(() => !shouldUseRemoteHistory)
  const [position, setPositionState] = useState<VertlyPosition>(() => {
    if (typeof window === "undefined") return { x: 24, y: 24 }
    return (
      readVertlyPosition(userKey) ??
      getDefaultPosition(window.innerWidth, window.innerHeight)
    )
  })

  const streamingMessageIdRef = useRef<string | null>(null)
  const pageContext = useMemo(
    () => mergePageContext(routeContext, pageOverride),
    [pageOverride, routeContext]
  )

  useEffect(() => {
    setPageOverride(null)
    setMessages((current) =>
      current.map((message) =>
        message.suggestions ? { ...message, suggestions: undefined } : message
      )
    )
  }, [location.pathname])

  useEffect(() => {
    let cancelled = false

    async function loadHistory() {
      setHistoryReady(false)

      if (shouldUseRemoteHistory && userId) {
        try {
          const stored = await readVertlyConversation(userId)
          const guestPending = takeGuestSessionMessages()
          // Drop legacy guest localStorage so anonymous chats never revive after login.
          clearVertlyHistory("guest")
          const merged = mergeVertlyHistories(stored, guestPending)
          if (!cancelled) {
            setMessages(merged)
            if (guestPending.length > 0) {
              await writeVertlyConversation(userId, merged)
            }
          }
        } catch {
          if (!cancelled) {
            const guestPending = takeGuestSessionMessages()
            setMessages(guestPending)
          }
        } finally {
          if (!cancelled) {
            setHistoryReady(true)
          }
        }
        return
      }

      if (!cancelled) {
        if (guestMode) {
          setMessages(readGuestSessionMessages())
        } else {
          setMessages([])
        }
        setHistoryReady(true)
      }
    }

    void loadHistory()

    return () => {
      cancelled = true
    }
  }, [guestMode, shouldUseRemoteHistory, userId, userKey, variant])

  useEffect(() => {
    if (!historyReady) return

    if (shouldUseRemoteHistory && userId) {
      void writeVertlyConversation(userId, messages)
      return
    }

    if (guestMode) {
      writeGuestSessionMessages(messages)
    }
  }, [guestMode, historyReady, messages, shouldUseRemoteHistory, userId])

  useEffect(() => {
    const proactive = pageContext.proactive
    if (!proactive || isOpen) {
      setShowProactive(false)
      return
    }
    setShowProactive(!isProactiveDismissed(userKey, proactive.id))
  }, [isOpen, pageContext.proactive, userKey])

  useEffect(() => {
    if (!autoOpenSignupWelcome || variant !== "signup") return
    if (hasSeenSignupWelcome()) return

    markSignupWelcomeSeen()
    setMessages([createMessage("assistant", getSignupWelcomeMessage())])
    setIsOpen(true)
  }, [autoOpenSignupWelcome, variant])

  useEffect(() => {
    function handleResize() {
      setPositionState((current) =>
        snapFromEdges(
          clampVertlyPosition(current, window.innerWidth, window.innerHeight),
          window.innerWidth
        )
      )
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const setPosition = useCallback(
    (next: VertlyPosition, options?: { snap?: boolean }) => {
      if (typeof window === "undefined") return
      const clamped = clampVertlyPosition(next, window.innerWidth, window.innerHeight)
      const final =
        options?.snap === false
          ? clamped
          : snapFromEdges(clamped, window.innerWidth)
      setPositionState(final)
      writeVertlyPosition(userKey, final)
    },
    [userKey]
  )

  const open = useCallback(() => {
    setIsOpen(true)
    setUnreadCount(0)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen((current) => {
      if (!current) setUnreadCount(0)
      return !current
    })
  }, [])

  const dismissProactiveSuggestion = useCallback(() => {
    const proactive = pageContext.proactive
    if (!proactive) return
    dismissProactive(userKey, proactive.id)
    setShowProactive(false)
  }, [pageContext.proactive, userKey])

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || isTyping) return

      const userMessage = createMessage("user", trimmed)
      let historySnapshot: VertlyMessage[] = []

      setMessages((current) => {
        historySnapshot = [...current, userMessage]
        return historySnapshot
      })

      setIsTyping(true)

      const assistantId = createMessage("assistant", "").id
      streamingMessageIdRef.current = assistantId
      setMessages((current) => [...current, { ...createMessage("assistant", ""), id: assistantId }])

      try {
        const enrichedContext = await buildVertlyEnrichedContext(userId)

        const response = await requestVertlyResponse(
          {
            message: trimmed,
            context: pageContext,
            history: historySnapshot,
            userId,
            enrichedContext,
          },
          (chunk) => {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId ? { ...message, content: chunk } : message
              )
            )
          }
        )

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: response.content, suggestions: response.suggestions }
              : message
          )
        )

        setUnreadCount((count) => (isOpen ? count : count + 1))
      } finally {
        streamingMessageIdRef.current = null
        setIsTyping(false)
      }
    },
    [isOpen, isTyping, pageContext, userId]
  )

  const selectSuggestion = useCallback(
    async (prompt: string) => {
      await sendMessage(prompt)
    },
    [sendMessage]
  )

  const registerPageContext = useCallback((context: Partial<VertlyPageContext> | null) => {
    setPageOverride(context)
  }, [])

  const { speechBubble, dismissSpeechBubble, showSpeechBubble } = useVertlyLifeEngine({
    userKey,
    variant,
    isOpen,
    pageContext,
    unreadCount,
  })

  const [launcherSuppressed, setLauncherSuppressed] = useState(false)

  const value = useMemo(
    () => ({
      variant,
      isOpen,
      isDragging,
      unreadCount,
      isTyping,
      messages,
      pageContext,
      position,
      showProactive,
      speechBubble,
      launcherSuppressed,
      open,
      close,
      toggle,
      sendMessage,
      selectSuggestion,
      dismissProactive: dismissProactiveSuggestion,
      dismissSpeechBubble,
      showSpeechBubble,
      setLauncherSuppressed,
      setDragging: setIsDragging,
      setPosition,
      registerPageContext,
    }),
    [
      variant,
      isOpen,
      isDragging,
      unreadCount,
      isTyping,
      messages,
      pageContext,
      position,
      showProactive,
      speechBubble,
      launcherSuppressed,
      open,
      close,
      toggle,
      sendMessage,
      selectSuggestion,
      dismissProactiveSuggestion,
      dismissSpeechBubble,
      showSpeechBubble,
      setPosition,
      registerPageContext,
    ]
  )

  return <VertlyContext.Provider value={value}>{children}</VertlyContext.Provider>
}

export { VertlyProvider }
