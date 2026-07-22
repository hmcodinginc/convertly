import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowUp, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"

import { ConvertlyMark } from "@/components/brand/ConvertlyMark"
import { GlassPanel } from "@/components/surfaces/GlassPanel"
import { VertlyMessageBubble } from "@/features/vertly/components/panel/VertlyMessageBubble"
import { VertlyQuickActionsBar } from "@/features/vertly/components/panel/VertlyQuickActionsBar"
import { VertlySuggestionsRail } from "@/features/vertly/components/panel/VertlySuggestionsRail"
import { VertlyTypingIndicator } from "@/features/vertly/components/panel/VertlyTypingIndicator"
import { VERTLY_PANEL_TRANSITION } from "@/features/vertly/motion/vertlyMotion"
import { getPanelWelcomeMessage } from "@/features/vertly/services/vertlyConversationService"
import type { VertlyMessage, VertlyPageContext, VertlyVariant } from "@/features/vertly/types"

type VertlyPanelProps = {
  anchor: {
    left: number
    top: number
    transformOrigin: string
  }
  variant: VertlyVariant
  pageContext: VertlyPageContext
  messages: VertlyMessage[]
  showProactive: boolean
  isTyping: boolean
  onClose: () => void
  onSendMessage: (content: string) => Promise<void>
  onSelectSuggestion: (prompt: string) => Promise<void>
  onDismissProactive: () => void
}

function VertlyPanel({
  anchor,
  variant,
  pageContext,
  messages,
  showProactive,
  isTyping,
  onClose,
  onSendMessage,
  onSelectSuggestion,
  onDismissProactive,
}: VertlyPanelProps) {
  const shouldReduceMotion = useReducedMotion()
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [draft, setDraft] = useState("")

  const hasUserMessages = messages.some((message) => message.role === "user")
  const hasAssistantReply = messages.some((message) => message.role === "assistant")
  const [suggestionsCollapsed, setSuggestionsCollapsed] = useState(true)
  const welcomeMessage = useMemo(
    () => getPanelWelcomeMessage(pageContext, variant),
    [pageContext, variant]
  )

  const composerPlaceholder =
    pageContext.surface === "recommendation-playbook"
      ? "Ask about this recommendation…"
      : "Ask about audits, features, or next steps…"

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (hasAssistantReply) {
      setSuggestionsCollapsed(true)
    }
  }, [hasAssistantReply])

  useEffect(() => {
    const container = messagesRef.current
    if (!container) return
    container.scrollTop = container.scrollHeight
  }, [messages, isTyping])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const value = draft.trim()
    if (!value) return
    setDraft("")
    await onSendMessage(value)
  }

  return (
    <motion.div
      className="vertly-panel-wrap"
      style={{
        left: anchor.left,
        top: anchor.top,
        transformOrigin: anchor.transformOrigin,
      }}
      initial={
        shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.92, y: 14, filter: "blur(8px)" }
      }
      animate={
        shouldReduceMotion
          ? { opacity: 1 }
          : { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }
      }
      exit={
        shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.94, y: 8, filter: "blur(6px)" }
      }
      transition={VERTLY_PANEL_TRANSITION}
      role="dialog"
      aria-modal="true"
      aria-label="Vertly assistant"
    >
      <GlassPanel className="vertly-panel">
        <header className="vertly-panel__header">
          <div className="vertly-panel__brand">
            <span className="vertly-panel__brand-icon" aria-hidden>
              <div className="audit-running-logo">
                <AnimatePresence mode="wait">
                  {isTyping && !shouldReduceMotion ? (
                    <motion.div
                      key="vertly-logo-spinning"
                      className="audit-running-logo__rotor"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.33, 1, 0.32, 1] }}
                    >
                      <ConvertlyMark size={30} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="vertly-logo-static"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <ConvertlyMark size={30} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </span>
            <div>
              <p className="vertly-panel__title">Vertly</p>
              <p className="vertly-panel__subtitle">Product Specialist</p>
            </div>
          </div>
          <button
            type="button"
            className="vertly-panel__close"
            onClick={onClose}
            aria-label="Close Vertly"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="vertly-panel__context">
          <p className="vertly-panel__context-label">{pageContext.title}</p>
          <p className="vertly-panel__context-copy">{pageContext.description}</p>
        </div>

        {showProactive && pageContext.proactive ? (
          <div className="vertly-proactive" role="status">
            <p className="vertly-proactive__text">{pageContext.proactive.label}</p>
            <div className="vertly-proactive__actions">
              {pageContext.proactive.href ? (
                <Link
                  to={pageContext.proactive.href}
                  className="vertly-proactive__link"
                  onClick={onClose}
                >
                  View
                </Link>
              ) : null}
              {pageContext.proactive.prompt ? (
                <button
                  type="button"
                  className="vertly-proactive__link"
                  onClick={() => void onSelectSuggestion(pageContext.proactive!.prompt!)}
                >
                  Ask Vertly
                </button>
              ) : null}
              <button
                type="button"
                className="vertly-proactive__dismiss"
                onClick={onDismissProactive}
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        <div ref={messagesRef} className="vertly-panel__messages">
          {!hasUserMessages ? (
            <VertlyMessageBubble
              message={{
                id: "vertly-welcome",
                role: "assistant",
                content: welcomeMessage,
                createdAt: 0,
              }}
            />
          ) : null}

          {messages.map((message) => (
            <VertlyMessageBubble key={message.id} message={message} />
          ))}

          {isTyping ? <VertlyTypingIndicator pageContext={pageContext} /> : null}
        </div>

        <div className="vertly-panel__footer">
          <form className="vertly-panel__composer" onSubmit={(event) => void handleSubmit(event)}>
          <label htmlFor="vertly-input" className="sr-only">
            Message Vertly
          </label>
          <textarea
            id="vertly-input"
            ref={inputRef}
            className="vertly-panel__input"
            rows={2}
            placeholder={composerPlaceholder}
            value={draft}
            onFocus={() => setSuggestionsCollapsed(true)}
            onChange={(event) => {
              setDraft(event.target.value)
              if (event.target.value.trim()) {
                setSuggestionsCollapsed(true)
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                void handleSubmit(event)
              }
            }}
          />
          <button
            type="submit"
            className="vertly-panel__send"
            disabled={!draft.trim() || isTyping}
            aria-label="Send message"
          >
            <ArrowUp className="size-4" />
          </button>
        </form>

        <VertlySuggestionsRail
          suggestions={pageContext.suggestions}
          isTyping={isTyping}
          forceCollapsed={suggestionsCollapsed}
          onSelectSuggestion={onSelectSuggestion}
        />

        <VertlyQuickActionsBar actions={pageContext.quickActions} onClose={onClose} />
        </div>
      </GlassPanel>
    </motion.div>
  )
}

export { VertlyPanel }
