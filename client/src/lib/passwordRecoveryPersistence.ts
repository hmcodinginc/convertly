import {
  isInAppRecoveryLanding,
  isPasswordRecoveryLanding,
  isStandaloneRecoveryLanding,
} from "@/lib/authRedirects"
import { getJson, removeItem, setJson } from "@/services/storage/sessionStorageClient"

const STORAGE_KEY = "convertly.auth.password-recovery"
const COMPLETED_KEY = "convertly.auth.password-recovery-completed"
const RECOVERY_IN_PROGRESS_KEY = "convertly.auth.recovery-in-progress"

export type PasswordRecoveryChannel = "standalone" | "in-app"

export type PasswordRecoveryPersistedState = {
  active: boolean
  channel: PasswordRecoveryChannel
  activatedAt: string
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

function markRecoveryInProgress(channel: PasswordRecoveryChannel): void {
  try {
    localStorage.setItem(RECOVERY_IN_PROGRESS_KEY, channel)
  } catch {
    /* storage unavailable */
  }
}

function clearRecoveryInProgress(): void {
  try {
    localStorage.removeItem(RECOVERY_IN_PROGRESS_KEY)
  } catch {
    /* storage unavailable */
  }
}

export function isPasswordRecoveryInProgressElsewhere(): boolean {
  try {
    return localStorage.getItem(RECOVERY_IN_PROGRESS_KEY) != null
  } catch {
    return false
  }
}

export function resolvePasswordRecoveryChannel(): PasswordRecoveryChannel {
  if (isStandaloneRecoveryLanding()) {
    return "standalone"
  }

  if (isInAppRecoveryLanding()) {
    return "in-app"
  }

  return "standalone"
}

export function isPasswordRecoveryActive(): boolean {
  if (isRecoveryCompleted()) return false
  return readActiveState()?.active === true
}

export function getPasswordRecoveryChannel(): PasswordRecoveryChannel | null {
  return readActiveState()?.channel ?? null
}

export function isStandalonePasswordRecoveryActive(): boolean {
  return isPasswordRecoveryActive() && getPasswordRecoveryChannel() === "standalone"
}

export function isInAppPasswordRecoveryActive(): boolean {
  return isPasswordRecoveryActive() && getPasswordRecoveryChannel() === "in-app"
}

export function activatePasswordRecovery(
  channel: PasswordRecoveryChannel = resolvePasswordRecoveryChannel()
): void {
  if (isRecoveryCompleted()) {
    return
  }

  clearRecoveryCompleted()
  markRecoveryInProgress(channel)
  setJson(STORAGE_KEY, {
    active: true,
    channel,
    activatedAt: new Date().toISOString(),
  })
}

export function clearPasswordRecovery(): void {
  removeItem(STORAGE_KEY)
  clearRecoveryInProgress()
}

/**
 * Call after a successful password reset. Clears active recovery state and blocks
 * auto-reopen until a new recovery flow starts.
 */
export function finalizePasswordRecovery(): void {
  clearPasswordRecovery()
  markRecoveryCompleted()
}

/**
 * One-time bootstrap while the recovery hash is still in the URL.
 */
export function bootstrapPasswordRecoveryFromUrl(): void {
  if (isRecoveryCompleted()) {
    return
  }

  if (isPasswordRecoveryLanding()) {
    activatePasswordRecovery(resolvePasswordRecoveryChannel())
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
