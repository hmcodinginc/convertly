import type { VertlyMessage, VertlyPosition } from "@/features/vertly/types"
import { getJson, removeItem, setJson } from "@/services/storage/localStorageClient"

const POSITION_PREFIX = "convertly:vertly:position:"
const HISTORY_PREFIX = "convertly:vertly:history:"
const SIGNUP_WELCOME_KEY = "convertly:vertly:signup-welcome"
const PROACTIVE_DISMISS_PREFIX = "convertly:vertly:proactive:"

function storageKey(prefix: string, userKey: string): string {
  return `${prefix}${userKey}`
}

export function getVertlyUserKey(userId?: string): string {
  return userId?.trim() ? userId : "guest"
}

export function readVertlyPosition(userKey: string): VertlyPosition | null {
  return getJson<VertlyPosition | null>(storageKey(POSITION_PREFIX, userKey), null)
}

export function writeVertlyPosition(userKey: string, position: VertlyPosition): void {
  setJson(storageKey(POSITION_PREFIX, userKey), position)
}

export function readVertlyHistory(userKey: string): VertlyMessage[] {
  return getJson<VertlyMessage[]>(storageKey(HISTORY_PREFIX, userKey), [])
}

export function writeVertlyHistory(userKey: string, messages: VertlyMessage[]): void {
  const trimmed = messages.slice(-40)
  setJson(storageKey(HISTORY_PREFIX, userKey), trimmed)
}

export function clearVertlyHistory(userKey: string): void {
  removeItem(storageKey(HISTORY_PREFIX, userKey))
}

export function clearVertlyLocalCache(userId?: string): void {
  clearVertlyHistory("guest")
  if (userId?.trim()) {
    clearVertlyHistory(userId)
  }
}

export function hasSeenSignupWelcome(): boolean {
  return getJson<boolean>(SIGNUP_WELCOME_KEY, false)
}

export function markSignupWelcomeSeen(): void {
  setJson(SIGNUP_WELCOME_KEY, true)
}

export function isProactiveDismissed(userKey: string, suggestionId: string): boolean {
  const map = getJson<Record<string, true>>(storageKey(PROACTIVE_DISMISS_PREFIX, userKey), {})
  return map[suggestionId] === true
}

export function dismissProactive(userKey: string, suggestionId: string): void {
  const map = getJson<Record<string, true>>(storageKey(PROACTIVE_DISMISS_PREFIX, userKey), {})
  map[suggestionId] = true
  setJson(storageKey(PROACTIVE_DISMISS_PREFIX, userKey), map)
}
