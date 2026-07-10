import { createContext } from "react"

import type {
  VertlyMessage,
  VertlyPageContext,
  VertlyPosition,
  VertlySpeechBubble,
  VertlyVariant,
} from "@/features/vertly/types"

export type VertlyContextValue = {
  variant: VertlyVariant
  isOpen: boolean
  isDragging: boolean
  unreadCount: number
  isTyping: boolean
  messages: VertlyMessage[]
  pageContext: VertlyPageContext
  position: VertlyPosition
  showProactive: boolean
  speechBubble: VertlySpeechBubble | null
  open: () => void
  close: () => void
  toggle: () => void
  sendMessage: (content: string) => Promise<void>
  selectSuggestion: (prompt: string) => Promise<void>
  dismissProactive: () => void
  dismissSpeechBubble: () => void
  setDragging: (dragging: boolean) => void
  setPosition: (position: VertlyPosition, options?: { snap?: boolean }) => void
  registerPageContext: (context: Partial<VertlyPageContext> | null) => void
}

export const VertlyContext = createContext<VertlyContextValue | null>(null)
