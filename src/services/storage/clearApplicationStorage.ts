import { removeItem } from "@/services/storage/localStorageClient"
import { STORAGE_KEYS } from "@/services/storage/keys"

/** Clears all Convertly client-side persistence (session, local auth, audits). */
export function clearApplicationStorage(): void {
  removeItem(STORAGE_KEYS.session)
  removeItem(STORAGE_KEYS.users)
  removeItem(STORAGE_KEYS.createdAudits)
  removeItem(STORAGE_KEYS.hasUserAudits)

  try {
    const keysToRemove: string[] = []
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (key?.startsWith(STORAGE_KEYS.auditDetailPrefix)) {
        keysToRemove.push(key)
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key)
    }
  } catch {
    /* storage unavailable */
  }
}
