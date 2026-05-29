import { delay } from "@/services/internal/delay"
import { getJson, removeItem, setJson } from "@/services/storage/localStorageClient"
import { STORAGE_KEYS } from "@/services/storage/keys"
import type { AuthSession, LoginInput } from "@/types/auth"

function createSession(email: string): AuthSession {
  return {
    userId: `user-${Date.now()}`,
    email,
    createdAt: new Date().toISOString(),
  }
}

export async function getSession(): Promise<AuthSession | null> {
  await delay(0)
  return getJson<AuthSession | null>(STORAGE_KEYS.session, null)
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return Boolean(session?.email)
}

export async function login(input: LoginInput): Promise<AuthSession> {
  await delay(80)
  const session = createSession(input.email)
  setJson(STORAGE_KEYS.session, session)
  return session
}

export async function logout(): Promise<void> {
  await delay(40)
  removeItem(STORAGE_KEYS.session)
}

/** Mock sign-in used by marketing CTAs before entering the app */
export async function ensureMockSession(): Promise<AuthSession> {
  const existing = await getSession()
  if (existing) return existing
  return login({ email: "demo@convertly.app" })
}
