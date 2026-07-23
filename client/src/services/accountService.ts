import { isBusinessFoundationEnabled } from "@/lib/businessFoundation"
import { planDisplayName } from "@/lib/billingPlans"
import { getPlanIdForUser } from "@/services/entitlementService"
import { resetPasswordRecoveryState } from "@/lib/passwordRecoveryPersistence"
import { clearAllProfileDrawerState } from "@/lib/profileDrawerPersistence"
import { validateChangePasswordFields } from "@/lib/authValidation"
import { validateProfileNameFields } from "@/lib/profileValidation"
import { resetSupabaseClient } from "@/services/auth/supabaseClient"
import * as supabaseAuth from "@/services/auth/supabaseAuthProvider"
import * as authRepository from "@/services/repositories/authRepository"
import * as authService from "@/services/authService"
import { fetchProfileExtras } from "@/services/profile/profileExtrasService"
import { clearApplicationStorage } from "@/services/storage/clearApplicationStorage"
import { shouldUseLocalAuth } from "@/lib/env"
import { formatPersonName } from "@/features/profile/utils/profileName"
import type { AccountInfo, ChangePasswordInput, UpdateProfileInput } from "@/types/account"

function normalizeOptional(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

async function updateProfileLocal(input: UpdateProfileInput): Promise<void> {
  const session = await authRepository.getStoredSession()
  if (!session) {
    throw new Error("Not signed in.")
  }

  const users = await authRepository.listStoredUsers()
  const user = users.find((entry) => entry.userId === session.userId)
  if (!user) {
    throw new Error("Profile not found for this account.")
  }

  const named = formatPersonName(input.firstName, input.lastName)
  const firstName = named.firstName
  const lastName = named.lastName
  const birthdate =
    input.birthdate !== undefined ? normalizeOptional(input.birthdate) : (user.birthdate ?? null)
  const country =
    input.country !== undefined ? normalizeOptional(input.country) : (user.country ?? null)

  let avatarUrl = user.avatarUrl ?? null
  if (input.removeAvatar) {
    avatarUrl = null
  } else if (input.avatarBlob) {
    avatarUrl = await blobToDataUrl(input.avatarBlob)
  } else if (input.avatarUrl !== undefined) {
    avatarUrl = normalizeOptional(input.avatarUrl)
  }

  await authRepository.saveStoredUser({
    ...user,
    firstName,
    lastName,
    birthdate,
    country,
    avatarUrl,
  })

  await authRepository.saveSession({
    ...session,
    firstName,
    lastName,
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
        return
      }
      reject(new Error("Unable to read avatar image."))
    }
    reader.onerror = () => reject(new Error("Unable to read avatar image."))
    reader.readAsDataURL(blob)
  })
}

async function changePasswordLocal(email: string, input: ChangePasswordInput): Promise<void> {
  const user = await authRepository.findStoredUserByEmail(email)
  if (!user || user.password !== input.currentPassword) {
    throw new Error("Current password is incorrect.")
  }

  await authRepository.saveStoredUser({
    ...user,
    password: input.newPassword,
  })
}

async function deleteAccountLocal(): Promise<void> {
  const session = await authRepository.getStoredSession()
  if (!session) {
    throw new Error("Not signed in.")
  }

  clearApplicationStorage()
  clearAllProfileDrawerState()
  resetPasswordRecoveryState()
}

export async function updateProfile(input: UpdateProfileInput): Promise<void> {
  const errors = validateProfileNameFields(input)
  if (Object.keys(errors).length > 0) {
    const firstError = errors.firstName ?? errors.lastName ?? "Invalid profile details."
    throw new Error(firstError)
  }

  if (shouldUseLocalAuth()) {
    await updateProfileLocal(input)
    return
  }

  await supabaseAuth.updateProfileWithSupabase(input)
}

export async function changePassword(email: string, input: ChangePasswordInput): Promise<void> {
  const errors = validateChangePasswordFields(input)
  if (Object.keys(errors).length > 0) {
    const firstError =
      errors.currentPassword ??
      errors.newPassword ??
      errors.confirmPassword ??
      "Invalid password details."
    throw new Error(firstError)
  }

  if (shouldUseLocalAuth()) {
    await changePasswordLocal(email, input)
    return
  }

  await supabaseAuth.changePasswordWithSupabase(email, input)
}

export async function requestAccountPasswordReset(email: string): Promise<void> {
  await authService.requestInAppPasswordReset({ email })
}

async function mergeProfileExtras(account: AccountInfo): Promise<AccountInfo> {
  if (shouldUseLocalAuth()) {
    const users = await authRepository.listStoredUsers()
    const user = users.find((entry) => entry.userId === account.userId)
    if (!user) return account
    return {
      ...account,
      birthdate: user.birthdate ?? null,
      country: user.country ?? null,
      avatarUrl: user.avatarUrl ?? null,
    }
  }

  const extras = await fetchProfileExtras(account.userId)
  if (!extras) return account

  return {
    ...account,
    birthdate: extras.birthdate,
    country: extras.country,
    avatarUrl: extras.avatarUrl,
  }
}

export async function getEnrichedAccount(): Promise<AccountInfo | null> {
  const account = await authService.getAccount()
  if (!account) return null

  let enriched = account

  try {
    enriched = await mergeProfileExtras(account)
  } catch {
    /* keep base account */
  }

  if (!isBusinessFoundationEnabled()) {
    return enriched
  }

  try {
    const planId = await getPlanIdForUser(account.userId)
    return { ...enriched, plan: planDisplayName(planId) }
  } catch {
    return enriched
  }
}

export async function deleteAccount(): Promise<void> {
  if (shouldUseLocalAuth()) {
    await deleteAccountLocal()
    return
  }

  await supabaseAuth.deleteAccountWithSupabase()

  try {
    await supabaseAuth.signOutWithSupabase()
  } catch {
    /* session may already be invalid after user deletion */
  }

  clearApplicationStorage()
  clearAllProfileDrawerState()
  resetPasswordRecoveryState()
  await authRepository.clearSession()
  resetSupabaseClient()
}
