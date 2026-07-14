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
  /** Structured audit context — populated on audit pages, not scraped from UI */
  auditContext?: VertlyAuditSnapshot | null
}

export type VertlyAuditSnapshot = {
  auditId: string
  website: string
  auditType?: string
  auditTypeLabel?: string
  status: string
  overallScore?: number
  scoreDelta?: number
  previousScore?: number
  criticalFindings: number
  highFindings: number
  mediumFindings: number
  lowFindings: number
  pagesScanned: number
  totalFindings?: number
  totalRecommendations?: number
  topRecommendations: Array<{
    id: string
    title: string
    priority: string
    category: string
    estimatedLift: string
    summary?: string
  }>
  topIssues: Array<{
    id: string
    issue: string
    severity: string
    category?: string
    impact: string
    page?: string
  }>
  scoreBreakdown?: Array<{
    label: string
    score: number
    status: string
    topImpacts?: Array<{ title: string; count: number; severity: string }>
  }>
  strengths?: string[]
  growthPotential?: number
  scoreCeiling?: number
  progress?: number
  stage?: string
  currentTask?: string
  selectedRecommendation?: {
    id: string
    title: string
    category: string
    priority: string
  }
  selectedFinding?: {
    id: string
    issue: string
    severity: string
    category?: string
    impact?: string
    page?: string
  }
  selectedPage?: {
    label: string
    path: string
    score: number
  }
}

export type VertlyConversationRequest = {
  message: string
  context: VertlyPageContext
  history: VertlyMessage[]
  userId?: string
  enrichedContext?: VertlyEnrichedContext | null
}

export type VertlyEnrichedContext = {
  account: {
    firstName: string
    lastName: string
    fullName: string
    email: string
  } | null
  plan: {
    planId: string
    planName: string
    status: string
    renewalDate: string | null
    cancelAtPeriodEnd: boolean
  }
  usage: {
    auditsUsed: number
    auditsIncluded: number
    auditsRemaining: number
    period: "lifetime" | "month"
    periodEnd: string | null
  }
  pendingPlan: { planId: string; planName: string } | null
  showPendingPlanCheckout: boolean
  scheduledPlanChange: {
    planId: string
    planName: string
    changeAtFormatted: string | null
  } | null
  workspace: {
    name: string
    domainCount: number
    primaryDomain: string | null
  }
  entitlement: {
    allowed: boolean
    blockedByLimit: boolean
    periodEndFormatted: string | null
  }
}

export type VertlyScope = "in_scope" | "out_of_scope" | "greeting" | "refusal"

export type VertlyDomain =
  | "product"
  | "account"
  | "billing"
  | "workspace"
  | "audit"
  | "report"
  | "dashboard"
  | "settings"

export type DashboardSubtopic =
  | "overview"
  | "metrics"
  | "opportunity-queue"
  | "recommendations"
  | "findings"

export type WorkspaceSubtopic =
  | "overview"
  | "ledger"
  | "counted-audits"
  | "remaining-audits"
  | "reset-date"

export type BillingSubtopic = "overview" | "plans" | "upgrades" | "renewals" | "limits"

export type AuditSubtopic =
  | "overview"
  | "score"
  | "findings"
  | "recommendation"
  | "strengths"
  | "weaknesses"
  | "timing"

export type VertlySubtopic =
  | DashboardSubtopic
  | WorkspaceSubtopic
  | BillingSubtopic
  | AuditSubtopic

export type VertlyRoutingResult = {
  scope: VertlyScope
  domain?: VertlyDomain
  subtopic?: VertlySubtopic | null
  confidence: number
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
