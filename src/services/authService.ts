import { shouldUseLocalAuth } from "@/lib/env"
import {
  bootstrapPasswordRecoveryFromUrl,
  clearPasswordRecovery,
  finalizePasswordRecovery,
  isPasswordRecoveryActive,
  resetPasswordRecoveryState,
} from "@/lib/passwordRecoveryPersistence"

import { delay } from "@/services/internal/delay"

import * as supabaseAuth from "@/services/auth/supabaseAuthProvider"

import * as authRepository from "@/services/repositories/authRepository"

import * as profileRepository from "@/services/repositories/profileRepository"

import type { AccountInfo } from "@/types/account"
import type {

  AuthResult,

  AuthSession,

  ForgotPasswordInput,

  LoginInput,

  SignupInput,

  StoredAuthUser,

} from "@/types/auth"



function createSessionFromUser(user: StoredAuthUser): AuthSession {

  return {

    userId: user.userId,

    email: user.email,

    firstName: user.firstName,

    lastName: user.lastName,

    createdAt: user.createdAt,

  }

}



async function signInLocal(input: LoginInput): Promise<AuthResult> {

  await delay(120)



  const user = await authRepository.findStoredUserByEmail(input.email)

  if (!user || user.password !== input.password) {

    throw new Error("Invalid email or password.")

  }



  const session = createSessionFromUser(user)

  await authRepository.saveSession(session)



  const profile = await profileRepository.getProfile(user.userId)

  if (!profile) {

    throw new Error("Profile not found for this account.")

  }



  return { session, profile }

}



async function signUpLocal(input: SignupInput): Promise<AuthResult> {

  await delay(160)



  const existing = await authRepository.findStoredUserByEmail(input.email)

  if (existing) {

    throw new Error("An account with this email already exists.")

  }



  const userId = `user-${Date.now()}`

  const createdAt = new Date().toISOString()



  const storedUser: StoredAuthUser = {

    userId,

    email: input.email.trim().toLowerCase(),

    password: input.password,

    firstName: input.firstName.trim(),

    lastName: input.lastName.trim(),

    createdAt,

  }



  await authRepository.saveStoredUser(storedUser)



  const profile = await profileRepository.createProfile(input, userId)

  await profileRepository.upsertProfile(profile)



  const session = createSessionFromUser(storedUser)

  await authRepository.saveSession(session)



  return { session, profile }

}



async function resetPasswordLocal(input: ForgotPasswordInput): Promise<void> {

  await delay(120)



  const user = await authRepository.findStoredUserByEmail(input.email)

  if (!user) {

    return

  }



  // MVP: no outbound email yet. Supabase reset flow will replace this.

}



export async function getSession(): Promise<AuthSession | null> {

  if (shouldUseLocalAuth()) {

    await delay(0)

    return authRepository.getStoredSession()

  }



  return supabaseAuth.getCurrentSession()

}



export async function validateSession(): Promise<AuthSession | null> {

  if (shouldUseLocalAuth()) {

    await delay(0)

    return authRepository.getStoredSession()

  }



  return supabaseAuth.getValidatedSession()

}



function buildAccountFromSession(session: AuthSession): AccountInfo {

  const fullName = `${session.firstName} ${session.lastName}`.trim()

  const displayName = fullName || session.email

  const firstInitial = session.firstName.trim().charAt(0)

  const lastInitial = session.lastName.trim().charAt(0)

  const initials =

    firstInitial && lastInitial

      ? `${firstInitial}${lastInitial}`.toUpperCase()

      : (firstInitial || session.email.charAt(0)).toUpperCase()



  return {

    userId: session.userId,

    email: session.email,

    firstName: session.firstName,

    lastName: session.lastName,

    fullName: displayName,

    initials,

    createdAt: session.createdAt,

    plan: "Free",

    authProvider: "Email",

  }

}



export async function getAccount(): Promise<AccountInfo | null> {

  if (shouldUseLocalAuth()) {

    const session = await authRepository.getStoredSession()

    if (!session) return null

    return buildAccountFromSession(session)

  }



  return supabaseAuth.getAccountInfo()

}



export async function isAuthenticated(): Promise<boolean> {

  const session = await validateSession()

  return Boolean(session?.email)

}



export async function login(input: LoginInput): Promise<AuthResult> {

  if (shouldUseLocalAuth()) {

    return signInLocal(input)

  }



  return supabaseAuth.signInWithSupabase(input)

}



export async function signup(input: SignupInput): Promise<AuthResult> {

  if (shouldUseLocalAuth()) {

    return signUpLocal(input)

  }



  return supabaseAuth.signUpWithSupabase(input)

}



export async function requestPasswordReset(input: ForgotPasswordInput): Promise<void> {

  if (shouldUseLocalAuth()) {

    return resetPasswordLocal(input)

  }



  return supabaseAuth.resetPasswordWithSupabase(input)

}



export async function hasPasswordRecoverySession(): Promise<boolean> {

  if (shouldUseLocalAuth()) {

    return false

  }



  return supabaseAuth.waitForPasswordRecoverySession()

}



export function subscribeToPasswordRecovery(onRecovery: () => void): () => void {

  if (shouldUseLocalAuth()) {

    return () => undefined

  }



  return supabaseAuth.subscribeToPasswordRecovery(onRecovery)

}



export {
  bootstrapPasswordRecoveryFromUrl,
  clearPasswordRecovery,
  finalizePasswordRecovery,
  isPasswordRecoveryActive,
  resetPasswordRecoveryState,
}



export async function completePasswordRecovery(
  password: string,
  options?: { keepSession?: boolean }
): Promise<void> {

  if (shouldUseLocalAuth()) {

    throw new Error("Password recovery is unavailable in local auth mode.")

  }



  return supabaseAuth.completePasswordRecoveryWithSupabase(password, options)

}



export async function logout(): Promise<void> {

  if (shouldUseLocalAuth()) {

    await delay(40)

    await authRepository.clearSession()

    return

  }



  resetPasswordRecoveryState()

  await supabaseAuth.signOutWithSupabase()

  await authRepository.clearSession()

}



/** Demo session helper for legacy flows — prefer explicit login/signup routes */

export async function ensureMockSession(): Promise<AuthSession> {

  const existing = await getSession()

  if (existing) return existing



  if (!shouldUseLocalAuth()) {

    throw new Error("Demo session is unavailable when Supabase auth is enabled.")

  }



  const demoEmail = "demo@convertly.app"

  const demoUser = await authRepository.findStoredUserByEmail(demoEmail)



  if (demoUser) {

    const session = createSessionFromUser(demoUser)

    await authRepository.saveSession(session)

    return session

  }



  return signup({

    firstName: "Demo",

    lastName: "User",

    email: demoEmail,

    password: "DemoPass1!",

  }).then(({ session }) => session)

}


