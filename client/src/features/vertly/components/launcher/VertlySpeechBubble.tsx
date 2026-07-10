import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import type { VertlySpeechBubble } from "@/features/vertly/types"

type VertlySpeechBubbleProps = {
  bubble: VertlySpeechBubble | null
  onDismiss: () => void
  onActivate: () => void
}

function VertlySpeechBubbleView({ bubble, onDismiss, onActivate }: VertlySpeechBubbleProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {bubble ? (
        <motion.div
          key={bubble.id}
          className="vertly-speech"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            type="button"
            className="vertly-speech__bubble"
            onClick={() => {
              onDismiss()
              if (bubble.opensPanel !== false) {
                onActivate()
              }
            }}
          >
            {bubble.message}
          </button>
          <span className="vertly-speech__tail" aria-hidden />
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export { VertlySpeechBubbleView }
