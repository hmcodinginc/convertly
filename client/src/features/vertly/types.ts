export type VertlySurface =
  | "signup"
  | "login"
  | "forgot-password"
  | "reset-password"
  | "dashboard"
  | "audit-new"
  | "audits"
  | "audit-detail"
  | "recommendation-playbook"
  | "workspace"
  | "billing"
  | "billing-return"
  | "settings"
  | "settings-profile"
  | "settings-preferences"
  | "settings-notifications"
  | "settings-security"
  | "settings-danger"
  | "generic"

export type VertlyMessageRole = "user" | "assistant" | "system"

export type VertlyMessage = {
  id: string
  role: VertlyMessageRole
  content: string
  createdAt: number
  suggestions?: VertlySuggestion[]
}

export type VertlySuggestion = {
  id: string
  label: string
  prompt?: string
  href?: string
}

export type VertlyQuickAction = {
  id: string
  label: string
  href: string
}

export type VertlyPageContext = {
  surface: VertlySurface
  title: string
  description: string
  suggestions: VertlySuggestion[]
  quickActions: VertlyQuickAction[]
  proactive?: VertlySuggestion | null
  metadata?: Record<string, string | number | boolean | null | undefined>
}

export type VertlyConversationRequest = {
  message: string
  context: VertlyPageContext
  history: VertlyMessage[]
  userId?: string
}

export type VertlyConversationResponse = {
  content: string
  suggestions?: VertlySuggestion[]
}

export type VertlyPosition = {
  x: number
  y: number
}

export type VertlyVariant = "authenticated" | "signup" | "guest-auth"

export type VertlyLifeAction =
  | "idle"
  | "look-left"
  | "look-right"
  | "blink"
  | "happy-blink"
  | "tilt-left"
  | "tilt-right"
  | "bounce"
  | "rotate"
  | "wave"
  | "shoulder"

export type VertlyEyeState =
  | "idle"
  | "curious"
  | "happy"
  | "thinking"
  | "processing"
  | "sleepy"
  | "look-left"
  | "look-right"
  | "look-up"
  | "look-down"

export type VertlyBodyMode =
  | "idle"
  | "hover"
  | "open"
  | "closing"
  | "thinking"
  | "processing"
  | "success"
  | "error"

export type VertlySpeechBubble = {
  id: string
  message: string
  autoDismissMs?: number
  opensPanel?: boolean
}

export type VertlyMilestoneId =
  | "first-login"
  | "first-audit"
  | "first-upgrade"
  | "first-billing"
