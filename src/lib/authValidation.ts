const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type FieldErrors<T extends string> = Partial<Record<T, string>>

export function validateEmail(email: string): string | null {
  const value = email.trim()
  if (!value) return "Email is required."
  if (!EMAIL_PATTERN.test(value)) return "Enter a valid email address."
  return null
}

export function validateRequired(value: string, label: string): string | null {
  if (!value.trim()) return `${label} is required.`
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required."
  if (password.length < 8) return "Password must be at least 8 characters."
  if (!/[A-Z]/.test(password)) return "Include at least one uppercase letter."
  if (!/[a-z]/.test(password)) return "Include at least one lowercase letter."
  if (!/[0-9]/.test(password)) return "Include at least one number."
  if (!/[^A-Za-z0-9]/.test(password)) return "Include at least one special character."
  return null
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string
): string | null {
  if (!confirmPassword) return "Confirm your password."
  if (password !== confirmPassword) return "Passwords do not match."
  return null
}

export type SignupField =
  | "firstName"
  | "lastName"
  | "email"
  | "password"
  | "confirmPassword"

export function validateSignupFields(input: {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}): FieldErrors<SignupField> {
  const errors: FieldErrors<SignupField> = {}

  const firstNameError = validateRequired(input.firstName, "First name")
  if (firstNameError) errors.firstName = firstNameError

  const lastNameError = validateRequired(input.lastName, "Last name")
  if (lastNameError) errors.lastName = lastNameError

  const emailError = validateEmail(input.email)
  if (emailError) errors.email = emailError

  const passwordError = validatePassword(input.password)
  if (passwordError) errors.password = passwordError

  const confirmError = validateConfirmPassword(input.password, input.confirmPassword)
  if (confirmError) errors.confirmPassword = confirmError

  return errors
}

export type ChangePasswordField = "currentPassword" | "newPassword" | "confirmPassword"

export function validateChangePasswordFields(input: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}): FieldErrors<ChangePasswordField> {
  const errors: FieldErrors<ChangePasswordField> = {}

  const currentError = validateRequired(input.currentPassword, "Current password")
  if (currentError) errors.currentPassword = currentError

  const passwordError = validatePassword(input.newPassword)
  if (passwordError) errors.newPassword = passwordError

  const confirmError = validateConfirmPassword(input.newPassword, input.confirmPassword)
  if (confirmError) errors.confirmPassword = confirmError

  if (
    input.currentPassword &&
    input.newPassword &&
    input.currentPassword === input.newPassword
  ) {
    errors.newPassword = "New password must be different from your current password."
  }

  return errors
}
