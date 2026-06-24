import { shouldUseLocalAuth } from "@/lib/env"
import { resetPasswordRecoveryState } from "@/lib/passwordRecoveryPersistence"
import { clearAllProfileDrawerState } from "@/lib/profileDrawerPersistence"
import { validateChangePasswordFields } from "@/lib/authValidation"
import { validateProfileNameFields } from "@/lib/profileValidation"
import { resetSupabaseClient } from "@/services/auth/supabaseClient"
import * as supabaseAuth from "@/services/auth/supabaseAuthProvider"
import * as authRepository from "@/services/repositories/authRepository"
import * as authService from "@/services/authService"
import { clearApplicationStorage } from "@/services/storage/clearApplicationStorage"
import type { ChangePasswordInput, UpdateProfileInput } from "@/types/account"

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

  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()

  await authRepository.saveStoredUser({
    ...user,
    firstName,
    lastName,
  })

  await authRepository.saveSession({
    ...session,
    firstName,
    lastName,
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
  await authService.requestPasswordReset({ email })
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
