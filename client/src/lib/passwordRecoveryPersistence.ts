import { isPasswordRecoveryLanding } from "@/lib/authRedirects"
import { getJson, removeItem, setJson } from "@/services/storage/sessionStorageClient"

const STORAGE_KEY = "convertly.auth.password-recovery"
const COMPLETED_KEY = "convertly.auth.password-recovery-completed"

const RECOVERY_DEBUG = import.meta.env.DEV

export type PasswordRecoveryPersistedState = {
  active: boolean
  activatedAt: string
}

function logRecovery(message: string, detail?: unknown): void {
  if (!RECOVERY_DEBUG) return
  if (detail === undefined) {
    console.info(`[password-recovery] ${message}`)
    return
  }
  console.info(`[password-recovery] ${message}`, detail)
}

function readActiveState(): PasswordRecoveryPersistedState | null {
  const state = getJson<PasswordRecoveryPersistedState | null>(STORAGE_KEY, null)
  return state?.active ? state : null
}

function isRecoveryCompleted(): boolean {
  try {
    return sessionStorage.getItem(COMPLETED_KEY) === "1"
  } catch {
    return false
  }
}

function markRecoveryCompleted(): void {
  try {
    sessionStorage.setItem(COMPLETED_KEY, "1")
  } catch {
    /* storage unavailable */
  }
}

function clearRecoveryCompleted(): void {
  removeItem(COMPLETED_KEY)
}

export function isPasswordRecoveryActive(): boolean {
  if (isRecoveryCompleted()) return false
  return readActiveState()?.active === true
}

export function activatePasswordRecovery(): void {
  if (isRecoveryCompleted()) {
    logRecovery("skipped activation because recovery was already completed")
    return
  }

  clearRecoveryCompleted()
  setJson(STORAGE_KEY, {
    active: true,
    activatedAt: new Date().toISOString(),
  })
  logRecovery("persistence created", readActiveState())
}

export function clearPasswordRecovery(): void {
  removeItem(STORAGE_KEY)
  logRecovery("persistence cleared")
}

/**
 * Call after a successful password reset. Clears active recovery state and blocks
 * auto-reopen until a new recovery flow starts.
 */
export function finalizePasswordRecovery(): void {
  clearPasswordRecovery()
  markRecoveryCompleted()
  logRecovery("recovery flow finalized")
}

/**
 * One-time bootstrap while the recovery hash is still in the URL.
 */
export function bootstrapPasswordRecoveryFromUrl(): void {
  if (isRecoveryCompleted()) {
    logRecovery("skipped URL bootstrap because recovery was already completed")
    return
  }

  if (isPasswordRecoveryLanding()) {
    activatePasswordRecovery()
  }
}

export function isPasswordRecoveryCompleted(): boolean {
  return isRecoveryCompleted()
}

export function resetPasswordRecoveryState(): void {
  clearPasswordRecovery()
  clearRecoveryCompleted()
}

export function readPasswordRecoveryState(): PasswordRecoveryPersistedState | null {
  return readActiveState()
}
