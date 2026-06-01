import { validateRequired, type FieldErrors } from "@/lib/authValidation"

export type ProfileNameField = "firstName" | "lastName"

export function validateProfileNameFields(input: {
  firstName: string
  lastName: string
}): FieldErrors<ProfileNameField> {
  const errors: FieldErrors<ProfileNameField> = {}

  const firstNameError = validateRequired(input.firstName, "First name")
  if (firstNameError) errors.firstName = firstNameError

  const lastNameError = validateRequired(input.lastName, "Last name")
  if (lastNameError) errors.lastName = lastNameError

  return errors
}
