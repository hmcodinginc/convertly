import { Loader2 } from "lucide-react"
import { useMemo, useState, type FormEvent } from "react"

import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { TextField } from "@/components/forms/TextField"
import { Button } from "@/components/ui/button"
import {
  validateChangePasswordFields,
  type ChangePasswordField,
} from "@/lib/authValidation"
import type { ChangePasswordInput } from "@/types/account"

type ChangePasswordFormProps = {
  email: string
  onChangePassword: (input: ChangePasswordInput) => Promise<void>
  onForgotPassword: () => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

function ChangePasswordForm({
  email,
  onChangePassword,
  onForgotPassword,
  onCancel,
  isSubmitting = false,
}: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ChangePasswordField, string>>>(
    {}
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null)
  const [isSendingReset, setIsSendingReset] = useState(false)

  const passwordHint = useMemo(
    () =>
      "Minimum 8 characters with uppercase, lowercase, number, and special character.",
    []
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setForgotSuccess(null)

    const errors = validateChangePasswordFields({
      currentPassword,
      newPassword,
      confirmPassword,
    })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await onChangePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to change password.")
    }
  }

  async function handleForgotPassword() {
    setFormError(null)
    setForgotSuccess(null)
    setIsSendingReset(true)

    try {
      await onForgotPassword()
      setForgotSuccess(
        `If an account exists for ${email}, reset instructions will be sent to your inbox.`
      )
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to send reset instructions."
      )
    } finally {
      setIsSendingReset(false)
    }
  }

  return (
    <form
      className="profile-drawer-form"
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
    >
      <div className="profile-drawer-section">
        <p className="profile-drawer-section-title">Verify and update</p>
        <div className="profile-drawer-fields">
          <TextField
            label="Current Password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value)
              if (fieldErrors.currentPassword) {
                setFieldErrors((current) => ({ ...current, currentPassword: undefined }))
              }
            }}
            error={fieldErrors.currentPassword}
            disabled={isSubmitting}
          />
          <TextField
            label="New Password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value)
              if (fieldErrors.newPassword) {
                setFieldErrors((current) => ({ ...current, newPassword: undefined }))
              }
            }}
            error={fieldErrors.newPassword}
            hint={passwordHint}
            disabled={isSubmitting}
          />
          <TextField
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value)
              if (fieldErrors.confirmPassword) {
                setFieldErrors((current) => ({ ...current, confirmPassword: undefined }))
              }
            }}
            error={fieldErrors.confirmPassword}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="profile-recovery-box">
        <p className="profile-recovery-text">
          Forgot your current password?
          <br />
          Send a password reset email to your account inbox.
        </p>
        <button
          type="button"
          className="profile-recovery-link"
          onClick={() => void handleForgotPassword()}
          disabled={isSubmitting || isSendingReset}
        >
          {isSendingReset ? "Sending password reset email…" : "Send password reset email"}
        </button>
      </div>

      {forgotSuccess ? (
        <AuthFormMessage variant="success">{forgotSuccess}</AuthFormMessage>
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
          Cancel
        </Button>
        <Button type="submit" size="sm" className="h-9" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Updating…
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </div>
    </form>
  )
}

export { ChangePasswordForm }
