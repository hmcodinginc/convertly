export type AccountInfo = {
  userId: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  initials: string
  createdAt: string
  plan: "Free"
  authProvider: string
}

export type UpdateProfileInput = {
  firstName: string
  lastName: string
}

export type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
