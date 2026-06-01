import { Loader2 } from "lucide-react"
import { useState, type FormEvent } from "react"

import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { TextField } from "@/components/forms/TextField"
import { Button } from "@/components/ui/button"
import { validateProfileNameFields } from "@/lib/profileValidation"
import type { UpdateProfileInput } from "@/types/account"

type ProfileEditFormProps = {
  initialFirstName: string
  initialLastName: string
  email: string
  onSave: (input: UpdateProfileInput) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

function ProfileEditForm({
  initialFirstName,
  initialLastName,
  email,
  onSave,
  onCancel,
  isSubmitting = false,
}: ProfileEditFormProps) {
  const [firstName, setFirstName] = useState(initialFirstName)
  const [lastName, setLastName] = useState(initialLastName)
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string
    lastName?: string
  }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setSaveSuccess(false)

    const errors = validateProfileNameFields({ firstName, lastName })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })
      setSaveSuccess(true)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save profile.")
    }
  }

  return (
    <form
      className="profile-drawer-form"
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
    >
      <div className="profile-drawer-section">
        <p className="profile-drawer-section-title">Personal information</p>
        <div className="profile-drawer-fields">
          <TextField
            label="First Name"
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => {
              setFirstName(event.target.value)
              if (fieldErrors.firstName) {
                setFieldErrors((current) => ({ ...current, firstName: undefined }))
              }
            }}
            error={fieldErrors.firstName}
            disabled={isSubmitting || saveSuccess}
          />
          <TextField
            label="Last Name"
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => {
              setLastName(event.target.value)
              if (fieldErrors.lastName) {
                setFieldErrors((current) => ({ ...current, lastName: undefined }))
              }
            }}
            error={fieldErrors.lastName}
            disabled={isSubmitting || saveSuccess}
          />
        </div>
      </div>

      <div className="profile-drawer-section">
        <p className="profile-drawer-section-title">Sign-in email</p>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          disabled
          readOnly
          hint="Email cannot be changed here."
        />
      </div>

      {saveSuccess ? (
        <AuthFormMessage variant="success">Profile updated successfully.</AuthFormMessage>
      ) : null}
      {formError ? <AuthFormMessage>{formError}</AuthFormMessage> : null}

      <div className="profile-drawer-footer">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {saveSuccess ? "Close" : "Cancel"}
        </Button>
        {!saveSuccess ? (
          <Button type="submit" size="sm" className="h-9" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
        ) : null}
      </div>
    </form>
  )
}

export { ProfileEditForm }
