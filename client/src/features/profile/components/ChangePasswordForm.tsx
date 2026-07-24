import { Loader2 } from "lucide-react"
import { useMemo, useState, type FormEvent } from "react"

import { AuthCaptcha } from "@/components/auth/AuthCaptcha"
import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { TextField } from "@/components/forms/TextField"
import { Button } from "@/components/ui/button"
import {
  validateChangePasswordFields,
  validateRecoveryPasswordFields,
  type ChangePasswordField,
} from "@/lib/authValidation"
import { isCaptchaEnabled } from "@/lib/env"
import type { ChangePasswordInput } from "@/types/account"

type ChangePasswordFormProps = {
  email: string
  onChangePassword: (input: ChangePasswordInput) => Promise<void>
  onForgotPassword: (captchaToken?: string) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  recoveryMode?: boolean
  initialNewPassword?: string
  initialConfirmPassword?: string
  onPersistValues?: (values: { newPassword: string; confirmPassword: string }) => void
}

function ChangePasswordForm({
  email,
  onChangePassword,
  onForgotPassword,
  onCancel,
  isSubmitting = false,
  recoveryMode = false,
  initialNewPassword = "",
  initialConfirmPassword = "",
  onPersistValues,
}: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState(initialNewPassword)
  const [confirmPassword, setConfirmPassword] = useState(initialConfirmPassword)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaResetNonce, setCaptchaResetNonce] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ChangePasswordField, string>>>(
    {}
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null)
  const [isSendingReset, setIsSendingReset] = useState(false)

  const captchaRequired = isCaptchaEnabled() && !recoveryMode
  const captchaReady = !captchaRequired || Boolean(captchaToken)

  const passwordHint = useMemo(
    () =>
      "Minimum 8 characters with uppercase, lowercase, number, and special character.",
    []
  )

  const persistValues = (nextNewPassword: string, nextConfirmPassword: string) => {
    onPersistValues?.({
      newPassword: nextNewPassword,
      confirmPassword: nextConfirmPassword,
    })
  }

  const resetCaptcha = () => {
    setCaptchaToken(null)
    setCaptchaResetNonce((value) => value + 1)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setForgotSuccess(null)

    if (recoveryMode) {
      const errors = validateRecoveryPasswordFields({ newPassword, confirmPassword })
      setFieldErrors(errors)
      if (Object.keys(errors).length > 0) return

      try {
        await onChangePassword({
          currentPassword: "",
          newPassword,
          confirmPassword,
        })
        setNewPassword("")
        setConfirmPassword("")
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Unable to change password.")
      }
      return
    }

    const errors = validateChangePasswordFields({
      currentPassword,
      newPassword,
      confirmPassword,
    })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    if (captchaRequired && !captchaToken) {
      setFormError("Please complete the security check before updating your password.")
      return
    }

    try {
      await onChangePassword({
        currentPassword,
        newPassword,
        confirmPassword,
        captchaToken: captchaToken ?? undefined,
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      resetCaptcha()
    } catch (error) {
      resetCaptcha()
      setFormError(error instanceof Error ? error.message : "Unable to change password.")
    }
  }

  async function handleForgotPassword() {
    setFormError(null)
    setForgotSuccess(null)

    if (captchaRequired && !captchaToken) {
      setFormError("Please complete the security check before requesting a reset link.")
      return
    }

    setIsSendingReset(true)

    try {
      await onForgotPassword(captchaToken ?? undefined)
      setForgotSuccess(
        `If an account exists for ${email}, reset instructions will be sent to your inbox.`
      )
      resetCaptcha()
    } catch (error) {
      resetCaptcha()
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
        <p className="profile-drawer-section-title">
          {recoveryMode ? "Set a new password" : "Verify and update"}
        </p>
        <div className="profile-drawer-fields">
          {!recoveryMode ? (
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
          ) : null}
          <TextField
            label="New Password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => {
              const value = event.target.value
              setNewPassword(value)
              persistValues(value, confirmPassword)
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
              const value = event.target.value
              setConfirmPassword(value)
              persistValues(newPassword, value)
              if (fieldErrors.confirmPassword) {
                setFieldErrors((current) => ({ ...current, confirmPassword: undefined }))
              }
            }}
            error={fieldErrors.confirmPassword}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {!recoveryMode ? (
        <>
          <AuthCaptcha onToken={setCaptchaToken} resetNonce={captchaResetNonce} />

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
              disabled={isSubmitting || isSendingReset || !captchaReady}
            >
              {isSendingReset ? "Sending password reset email…" : "Send password reset email"}
            </button>
          </div>
        </>
      ) : null}

      {forgotSuccess ? (
        <AuthFormMessage variant="success">{forgotSuccess}</AuthFormMessage>
      ) : null}
      {formError ? <AuthFormMessage>{formError}</AuthFormMessage> : null}

      <div className="profile-drawer-footer">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting || !captchaReady}>
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
