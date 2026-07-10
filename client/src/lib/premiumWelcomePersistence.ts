import type { EffectivePlanId, SubscriptionPlanId } from "@/lib/billingPlans"
import { getJson, setJson } from "@/services/storage/localStorageClient"
import { getJson as getSessionJson, removeItem, setJson as setSessionJson } from "@/services/storage/sessionStorageClient"

const WELCOME_DISMISSED_KEY = "convertly:premium-welcome-dismissed"
const ACTIVATION_SESSION_KEY = "convertly:premium-activated"

export type PremiumActivationContext = {
  planId: SubscriptionPlanId
  planName: string
  previousPlanId: EffectivePlanId
  activatedAt: number
}

type DismissedWelcomeMap = Record<string, true>

function welcomeKey(userId: string, planId: string): string {
  return `${userId}:${planId}`
}

function readDismissedMap(): DismissedWelcomeMap {
  return getJson<DismissedWelcomeMap>(WELCOME_DISMISSED_KEY, {})
}

function writeDismissedMap(map: DismissedWelcomeMap): void {
  setJson(WELCOME_DISMISSED_KEY, map)
}

export function markPremiumActivated(context: PremiumActivationContext): void {
  setSessionJson(ACTIVATION_SESSION_KEY, context)
}

export function peekPremiumActivation(): PremiumActivationContext | null {
  const context = getSessionJson<PremiumActivationContext | null>(ACTIVATION_SESSION_KEY, null)
  if (!context?.planId || !context.planName) return null
  return context
}

export function consumePremiumActivation(): PremiumActivationContext | null {
  const context = peekPremiumActivation()
  if (!context) return null
  removeItem(ACTIVATION_SESSION_KEY)
  return context
}

export function clearPremiumActivationSession(): void {
  removeItem(ACTIVATION_SESSION_KEY)
}

export function isPremiumWelcomeDismissed(userId: string, planId: string): boolean {
  return readDismissedMap()[welcomeKey(userId, planId)] === true
}

export function dismissPremiumWelcome(userId: string, planId: string): void {
  const map = readDismissedMap()
  map[welcomeKey(userId, planId)] = true
  writeDismissedMap(map)
}

export function shouldShowPremiumWelcome(userId: string, planId: string): boolean {
  if (!userId || planId === "free" || planId === "internal") return false
  return !isPremiumWelcomeDismissed(userId, planId)
}
