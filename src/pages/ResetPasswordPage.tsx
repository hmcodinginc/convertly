import { Loader2 } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { TextField } from "@/components/forms/TextField"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import {
  validateConfirmPassword,
  validatePassword,
  type FieldErrors,
} from "@/lib/authValidation"
import { shouldUseLocalAuth } from "@/lib/env"
import { ROUTES } from "@/lib/routes"
import * as authService from "@/services/authService"

type ResetField = "password" | "confirmPassword"

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<ResetField>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecoveryReady, setIsRecoveryReady] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    if (shouldUseLocalAuth()) {
      setIsCheckingSession(false)
      return
    }

    let cancelled = false

    async function verifyRecoverySession() {
      try {
        const ready = await authService.hasPasswordRecoverySession()
        if (!cancelled) {
          setIsRecoveryReady(ready)
        }
      } finally {
        if (!cancelled) {
          setIsCheckingSession(false)
        }
      }
    }

    void verifyRecoverySession()

    const unsubscribe = authService.subscribeToPasswordRecovery(() => {
      setIsRecoveryReady(true)
      setIsCheckingSession(false)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const errors: FieldErrors<ResetField> = {}
    const passwordError = validatePassword(password)
    if (passwordError) errors.password = passwordError

    const confirmError = validateConfirmPassword(password, confirmPassword)
    if (confirmError) errors.confirmPassword = confirmError

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)

    try {
      await authService.completePasswordRecovery(password)
      navigate(ROUTES.login, {
        replace: true,
        state: { passwordReset: true },
      })
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to reset password."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (shouldUseLocalAuth()) {
    return (
      <div className="auth-form-page">
        <AuthFormMessage>
          Password recovery is unavailable in local auth mode. Use Change Password on the
          profile page instead.
        </AuthFormMessage>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link to={ROUTES.login}>Back to sign in</Link>
        </Button>
      </div>
    )
  }

  if (isCheckingSession) {
    return (
      <div className="auth-form-page">
        <Text variant="muted" size="sm" className="max-w-none">
          Verifying reset link…
        </Text>
      </div>
    )
  }

  if (!isRecoveryReady) {
    return (
      <div className="auth-form-page">
        <div className="auth-form-header">
          <Heading level={1} size="section">
            Reset link invalid or expired
          </Heading>
          <Text variant="muted" size="sm" className="max-w-none leading-6">
            Request a new password reset email and open the latest link from your inbox.
          </Text>
        </div>
        <Button asChild className="auth-form-submit h-10 w-full">
          <Link to={ROUTES.forgotPassword}>Request new reset link</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="auth-form-page">
      <div className="auth-form-header">
        <Heading level={1} size="section">
          Set a new password
        </Heading>
        <Text variant="muted" size="sm" className="max-w-none leading-6">
          Choose a strong password for your Convertly account.
        </Text>
      </div>

      <form className="auth-form-stack" onSubmit={handleSubmit} noValidate>
        <TextField
          label="New Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            if (fieldErrors.password) {
              setFieldErrors((current) => ({ ...current, password: undefined }))
            }
          }}
          error={fieldErrors.password}
          hint="Minimum 8 characters with uppercase, lowercase, number, and special character."
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

        {formError ? <AuthFormMessage>{formError}</AuthFormMessage> : null}

        <Button type="submit" className="auth-form-submit h-10 w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Updating password…
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>

      <div className="auth-form-footer">
        <Text size="sm" variant="muted" className="max-w-none leading-6">
          <Link to={ROUTES.login} className="text-foreground/88 transition-colors hover:text-foreground">
            Back to sign in
          </Link>
        </Text>
      </div>
    </div>
  )
}

export default ResetPasswordPage
