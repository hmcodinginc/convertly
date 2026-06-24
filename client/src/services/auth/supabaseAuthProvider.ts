import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
  type User,
} from "@supabase/supabase-js"

import { getEmailConfirmationRedirectUrl, getPasswordResetRedirectUrl } from "@/lib/authRedirects"
import { logAuthEvent } from "@/lib/authDebugLog"
import {
  activatePasswordRecovery,
  bootstrapPasswordRecoveryFromUrl,
  finalizePasswordRecovery,
  isPasswordRecoveryActive,
  isPasswordRecoveryCompleted,
} from "@/lib/passwordRecoveryPersistence"
import { ROUTES } from "@/lib/routes"
import { getSupabaseClient } from "@/services/auth/supabaseClient"
import type { AccountInfo, ChangePasswordInput, UpdateProfileInput } from "@/types/account"
import type {
  AuthResult,
  AuthSession,
  ForgotPasswordInput,
  LoginInput,
  SignupInput,
  UserProfile,
} from "@/types/auth"

function readMetadataString(user: User, key: string): string {
  const metadata = user.user_metadata ?? {}
  const value = metadata[key]
  return typeof value === "string" ? value : ""
}

function mapUserToProfile(user: User): UserProfile {
  const createdAt = user.created_at ?? new Date().toISOString()

  return {
    userId: user.id,
    firstName: readMetadataString(user, "firstName"),
    lastName: readMetadataString(user, "lastName"),
    email: user.email ?? readMetadataString(user, "email"),
    createdAt,
    updatedAt: createdAt,
  }
}

function mapUserToSession(user: User): AuthSession {
  const profile = mapUserToProfile(user)

  return {
    userId: profile.userId,
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    createdAt: profile.createdAt,
  }
}

function toAuthError(error: { message: string }): Error {
  return new Error(error.message)
}

function resolveAuthProvider(user: User): string {
  const provider =
    user.app_metadata?.provider ??
    user.identities?.[0]?.provider ??
    (user.email ? "email" : "unknown")

  if (provider === "email") return "Email"
  return provider.charAt(0).toUpperCase() + provider.slice(1)
}

export function subscribeToAuthChanges(onChange: () => void): () => void {
  const supabase = getSupabaseClient()
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event) => {
    logAuthEvent(event)
    onChange()
  })

  return () => subscription.unsubscribe()
}

export async function getValidatedSession(): Promise<AuthSession | null> {
  const supabase = getSupabaseClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const cachedUser = sessionData.session?.user

  if (!cachedUser) {
    return null
  }

  const { data, error } = await supabase.auth.getUser()

  if (!error && data.user) {
    return mapUserToSession(data.user)
  }

  const message = error?.message.toLowerCase() ?? ""
  const isAuthError =
    error?.status === 401 ||
    message.includes("jwt") ||
    message.includes("invalid") ||
    message.includes("expired") ||
    message.includes("session")

  if (isAuthError) {
    await supabase.auth.signOut().catch(() => undefined)
    return null
  }

  // Preserve signed-in state across refresh when validation is temporarily unavailable.
  return mapUserToSession(cachedUser)
}

export async function getAccountInfo(): Promise<AccountInfo | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return null
  }

  const profile = mapUserToProfile(data.user)
  const fullName = `${profile.firstName} ${profile.lastName}`.trim()
  const displayName = fullName || profile.email

  return {
    userId: profile.userId,
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    fullName: displayName,
    initials: buildInitials(profile.firstName, profile.lastName, profile.email),
    createdAt: profile.createdAt,
    plan: "Free",
    authProvider: resolveAuthProvider(data.user),
  }
}

function buildInitials(firstName: string, lastName: string, email: string): string {
  const first = firstName.trim().charAt(0)
  const last = lastName.trim().charAt(0)

  if (first && last) return `${first}${last}`.toUpperCase()
  if (first) return first.toUpperCase()
  if (email) return email.charAt(0).toUpperCase()
  return "C"
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw toAuthError(error)
  }

  if (!data.session?.user) {
    return null
  }

  return mapUserToSession(data.session.user)
}

export async function signUpWithSupabase(input: SignupInput): Promise<AuthResult> {
  const supabase = getSupabaseClient()
  const email = input.email.trim().toLowerCase()

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      emailRedirectTo: getEmailConfirmationRedirectUrl(),
      data: {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email,
      },
    },
  })

  if (error) {
    throw toAuthError(error)
  }

  if (!data.user) {
    throw new Error("Unable to create account. Please try again.")
  }

  if (!data.session) {
    throw new Error(
      "Account created. Check your email to confirm your address, then sign in."
    )
  }

  return {
    session: mapUserToSession(data.user),
    profile: mapUserToProfile(data.user),
  }
}

export async function signInWithSupabase(input: LoginInput): Promise<AuthResult> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim().toLowerCase(),
    password: input.password,
  })

  if (error) {
    throw toAuthError(error)
  }

  if (!data.user) {
    throw new Error("Invalid email or password.")
  }

  return {
    session: mapUserToSession(data.user),
    profile: mapUserToProfile(data.user),
  }
}

export async function signOutWithSupabase(): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw toAuthError(error)
  }
}

export async function resetPasswordWithSupabase(
  input: ForgotPasswordInput
): Promise<void> {
  const supabase = getSupabaseClient()
  const redirectTo = getPasswordResetRedirectUrl()

  const { error } = await supabase.auth.resetPasswordForEmail(
    input.email.trim().toLowerCase(),
    { redirectTo }
  )

  if (error) {
    throw toAuthError(error)
  }
}

export async function updateProfileWithSupabase(input: UpdateProfileInput): Promise<void> {
  const supabase = getSupabaseClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    throw new Error("Not signed in.")
  }

  const email = userData.user.email ?? ""

  const { error } = await supabase.auth.updateUser({
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
    },
  })

  if (error) {
    throw toAuthError(error)
  }

  const { error: refreshError } = await supabase.auth.refreshSession()
  if (refreshError) {
    throw toAuthError(refreshError)
  }
}

async function pollForSupabaseSession(attempts: number, delayMs: number): Promise<boolean> {
  const supabase = getSupabaseClient()

  for (let index = 0; index < attempts; index += 1) {
    const { data, error } = await supabase.auth.getSession()
    if (!error && data.session) {
      return true
    }
    await new Promise((resolve) => {
      setTimeout(resolve, delayMs)
    })
  }

  return false
}

export async function waitForPasswordRecoverySession(): Promise<boolean> {
  if (isPasswordRecoveryCompleted()) {
    return false
  }

  bootstrapPasswordRecoveryFromUrl()

  if (!isPasswordRecoveryActive()) {
    return false
  }

  return pollForSupabaseSession(24, 150)
}

export async function hasPasswordRecoverySession(): Promise<boolean> {
  return waitForPasswordRecoverySession()
}

export function subscribeToPasswordRecovery(onRecovery: () => void): () => void {
  const supabase = getSupabaseClient()
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      logAuthEvent(event)
      activatePasswordRecovery()
      onRecovery()
    }
  })

  return () => subscription.unsubscribe()
}

type CompletePasswordRecoveryOptions = {
  keepSession?: boolean
}

export async function completePasswordRecoveryWithSupabase(
  password: string,
  options: CompletePasswordRecoveryOptions = {}
): Promise<void> {
  const supabase = getSupabaseClient()
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !sessionData.session) {
    throw new Error("Reset link invalid or expired. Request a new password reset email.")
  }

  const { error: updateError } = await supabase.auth.updateUser({ password })
  if (updateError) {
    throw toAuthError(updateError)
  }

  finalizePasswordRecovery()

  if (typeof window !== "undefined") {
    window.history.replaceState({}, document.title, window.location.pathname)
  }

  if (options.keepSession) {
    const { error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError) {
      throw toAuthError(refreshError)
    }
  } else {
    await supabase.auth.signOut().catch(() => undefined)
  }
}

async function reauthenticateWithPassword(
  supabase: ReturnType<typeof getSupabaseClient>,
  email: string,
  password: string
): Promise<void> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.session) {
    throw new Error("Current password is incorrect.")
  }
}

export async function changePasswordWithSupabase(
  email: string,
  input: ChangePasswordInput
): Promise<void> {
  const supabase = getSupabaseClient()
  const normalizedEmail = email.trim().toLowerCase()

  await reauthenticateWithPassword(supabase, normalizedEmail, input.currentPassword)

  const { error: updateError } = await supabase.auth.updateUser({
    password: input.newPassword,
  })

  if (updateError) {
    const message = updateError.message.toLowerCase()
    if (message.includes("reauthenticate") || message.includes("nonce")) {
      throw new Error(
        "Additional verification is required. Use the password reset email link to update your password."
      )
    }
    throw toAuthError(updateError)
  }

  const { error: refreshError } = await supabase.auth.refreshSession()
  if (refreshError) {
    throw toAuthError(refreshError)
  }
}

type DeleteAccountResponse = {
  ok?: boolean
  error?: string
}

const DELETE_ACCOUNT_FUNCTION = "delete-account"

async function readFunctionsErrorMessage(error: FunctionsHttpError): Promise<string | null> {
  const response = error.context
  if (!response || typeof response.json !== "function") {
    return null
  }

  try {
    const body = (await response.json()) as DeleteAccountResponse
    return body.error ?? null
  } catch {
    return null
  }
}

function toDeleteAccountInvokeError(error: unknown): Error {
  if (error instanceof FunctionsFetchError) {
    return new Error(
      "Could not reach the delete-account service. The Edge Function may not be deployed yet. Ask your administrator to deploy it, then try again."
    )
  }

  if (error instanceof FunctionsRelayError) {
    return new Error(
      "The delete-account service is temporarily unavailable. Please try again in a moment."
    )
  }

  if (error instanceof FunctionsHttpError) {
    return error
  }

  if (error instanceof Error) {
    return error
  }

  return new Error("Unable to delete account. Please try again.")
}

export async function deleteAccountWithSupabase(): Promise<void> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.functions.invoke<DeleteAccountResponse>(
    DELETE_ACCOUNT_FUNCTION,
    { method: "POST" }
  )

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const message = await readFunctionsErrorMessage(error)
      throw new Error(message ?? "Unable to delete account. Please try again.")
    }

    throw toDeleteAccountInvokeError(error)
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  if (!data?.ok) {
    throw new Error("Unable to delete account. Please try again.")
  }
}
