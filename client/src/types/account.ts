export type AccountInfo = {
  userId: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  initials: string
  createdAt: string
  plan: string
  authProvider: string
  /** Optional ISO date YYYY-MM-DD */
  birthdate?: string | null
  /** Optional ISO 3166-1 alpha-2 */
  country?: string | null
  /** Optional public avatar URL */
  avatarUrl?: string | null
}

export type UpdateProfileInput = {
  firstName: string
  lastName: string
  /** ISO date YYYY-MM-DD, empty string / null clears */
  birthdate?: string | null
  /** ISO country code, empty string / null clears */
  country?: string | null
  /** Public avatar URL, empty string / null clears */
  avatarUrl?: string | null
  /** When set, uploads this blob before persisting avatarUrl */
  avatarBlob?: Blob | null
  /** Explicitly remove existing avatar */
  removeAvatar?: boolean
}

export type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
  /** Required when Supabase Auth CAPTCHA (Turnstile) is enabled. */
  captchaToken?: string
}
