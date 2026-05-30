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
}

export type SignupInput = {
  firstName: string
  lastName: string
  email: string
  password: string
}

export type ForgotPasswordInput = {
  email: string
}

export type UserProfile = {
  userId: string
  firstName: string
  lastName: string
  email: string
  createdAt: string
  updatedAt: string
}

export type StoredAuthUser = {
  userId: string
  email: string
  password: string
  firstName: string
  lastName: string
  createdAt: string
}

export type AuthResult = {
  session: AuthSession
  profile: UserProfile
}
