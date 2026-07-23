import { AnimatePresence } from "framer-motion"
import { useEffect } from "react"

import { VertlyBackdrop } from "@/features/vertly/components/VertlyBackdrop"
import { VertlyLauncher } from "@/features/vertly/components/launcher/VertlyLauncher"
import { VertlyPanel } from "@/features/vertly/components/panel/VertlyPanel"
import { useVertly } from "@/features/vertly/hooks/useVertly"
import { useVertlyDrag } from "@/features/vertly/hooks/useVertlyDrag"
import { useVertlyPanelAnchor } from "@/features/vertly/hooks/useVertlyPanelAnchor"

function VertlyWidget() {
  const {
    isOpen,
    isDragging,
    isTyping,
    messages,
    pageContext,
    position,
    showProactive,
    speechBubble,
    launcherSuppressed,
    variant,
    toggle,
    open,
    close,
    sendMessage,
    selectSuggestion,
    dismissProactive,
    dismissSpeechBubble,
    setDragging,
    setPosition,
  } = useVertly()

  const panelAnchor = useVertlyPanelAnchor(position)

  const dragHandlers = useVertlyDrag({
    position,
    isOpen,
    setPosition,
    setDragging,
    onToggle: toggle,
  })

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault()
        close()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [close, isOpen])

  return (
    <div className="vertly-root" aria-live="polite">
      <AnimatePresence>
        {isOpen ? (
          <>
            <VertlyBackdrop onClose={close} />
            <VertlyPanel
              anchor={panelAnchor}
              variant={variant}
              pageContext={pageContext}
              messages={messages}
              showProactive={showProactive}
              isTyping={isTyping}
              onClose={close}
              onSendMessage={sendMessage}
              onSelectSuggestion={selectSuggestion}
              onDismissProactive={dismissProactive}
            />
          </>
        ) : null}
      </AnimatePresence>

      {!launcherSuppressed ? (
        <VertlyLauncher
          position={position}
          isOpen={isOpen}
          isDragging={isDragging}
          isTyping={isTyping}
          speechBubble={speechBubble}
          onDismissSpeechBubble={dismissSpeechBubble}
          onSpeechBubbleActivate={open}
          onPointerDown={dragHandlers.handlePointerDown}
          onClick={dragHandlers.handleClick}
        />
      ) : null}
    </div>
  )
}

export { VertlyWidget }
