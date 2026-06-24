import { getJson, removeItem, setJson } from "@/services/storage/localStorageClient"
import { STORAGE_KEYS } from "@/services/storage/keys"
import type { AuthSession, StoredAuthUser } from "@/types/auth"

export async function getStoredSession(): Promise<AuthSession | null> {
  return getJson<AuthSession | null>(STORAGE_KEYS.session, null)
}

export async function saveSession(session: AuthSession): Promise<void> {
  setJson(STORAGE_KEYS.session, session)
}

export async function clearSession(): Promise<void> {
  removeItem(STORAGE_KEYS.session)
}

export async function listStoredUsers(): Promise<StoredAuthUser[]> {
  return getJson<StoredAuthUser[]>(STORAGE_KEYS.users, [])
}

export async function findStoredUserByEmail(
  email: string
): Promise<StoredAuthUser | null> {
  const normalized = email.trim().toLowerCase()
  const users = await listStoredUsers()
  return users.find((user) => user.email.toLowerCase() === normalized) ?? null
}

export async function saveStoredUser(user: StoredAuthUser): Promise<void> {
  const users = await listStoredUsers()
  const nextUsers = users.filter(
    (existing) => existing.email.toLowerCase() !== user.email.toLowerCase()
  )
  setJson(STORAGE_KEYS.users, [...nextUsers, user])
}
