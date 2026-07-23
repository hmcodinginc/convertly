export type AuthSession = {
  userId: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
}

export type LoginInput = {
  email: string
  password: string
  captchaToken?: string
}

export type SignupInput = {
  firstName: string
  lastName: string
  email: string
  password: string
  captchaToken?: string
}

export type ForgotPasswordInput = {
  email: string
  captchaToken?: string
}

export type UserProfile = {
  userId: string
  firstName: string
  lastName: string
  email: string
  createdAt: string
  updatedAt: string
  birthdate?: string | null
  country?: string | null
  avatarUrl?: string | null
}

export type StoredAuthUser = {
  userId: string
  email: string
  password: string
  firstName: string
  lastName: string
  createdAt: string
  birthdate?: string | null
  country?: string | null
  avatarUrl?: string | null
}

export type AuthResult = {
  session: AuthSession
  profile: UserProfile
}

/**
 * Thrown when signup targets an email that already has an account.
 * Detected via Supabase's obfuscated existing-user response (empty identities),
 * without any email-enumeration lookup.
 */
export class AccountExistsError extends Error {
  constructor(
    message = "An account with this email already exists. Please sign in."
  ) {
    super(message)
    this.name = "AccountExistsError"
  }
}

/**
 * Thrown when Supabase Auth rate-limits the request (HTTP 429).
 */
export class AuthRateLimitError extends Error {
  readonly retryAfterSeconds?: number

  constructor(message: string, retryAfterSeconds?: number) {
    super(message)
    this.name = "AuthRateLimitError"
    this.retryAfterSeconds = retryAfterSeconds
  }
}
