import { CheckCircle2, Loader2 } from "lucide-react"
import { useEffect, useLayoutEffect, useMemo, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { AuthAboutLink } from "@/components/auth/AuthLegalLinks"
import { TextField } from "@/components/forms/TextField"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { validateRecoveryPasswordFields } from "@/lib/authValidation"
import { shouldUseLocalAuth } from "@/lib/env"
import {
  bootstrapPasswordRecoveryFromUrl,
  isInAppPasswordRecoveryActive,
  isStandalonePasswordRecoveryActive,
} from "@/lib/passwordRecoveryPersistence"
import { ROUTES } from "@/lib/routes"
import * as authService from "@/services/authService"

const LOGIN_REDIRECT_DELAY_MS = 5_000

type ResetPhase = "checking" | "invalid" | "form" | "submitting" | "success"

function ResetPasswordPage() {
  const navigate = useNavigate()
  const isLocalAuth = shouldUseLocalAuth()
  const [phase, setPhase] = useState<ResetPhase>(() => (isLocalAuth ? "invalid" : "checking"))
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{
    newPassword?: string
    confirmPassword?: string
  }>({})
  const [formError, setFormError] = useState<string | null>(null)

  const passwordHint = useMemo(
    () =>
      "Minimum 8 characters with uppercase, lowercase, number, and special character.",
    []
  )

  useLayoutEffect(() => {
    if (isLocalAuth) return
    bootstrapPasswordRecoveryFromUrl()

    if (isInAppPasswordRecoveryActive()) {
      navigate(ROUTES.profile, { replace: true })
    }
  }, [isLocalAuth, navigate])

  useEffect(() => {
    if (isLocalAuth) return

    let cancelled = false

    async function verifyRecoverySession() {
      try {
        const ready = await authService.hasPasswordRecoverySession()
        const isStandaloneReady = ready && isStandalonePasswordRecoveryActive()
        if (!cancelled) {
          setPhase(isStandaloneReady ? "form" : "invalid")
        }
      } catch {
        if (!cancelled) {
          setPhase("invalid")
        }
      }
    }

    void verifyRecoverySession()

    const unsubscribe = authService.subscribeToPasswordRecovery(() => {
      if (!cancelled && isStandalonePasswordRecoveryActive()) {
        setPhase("form")
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [isLocalAuth])

  useEffect(() => {
    if (phase !== "success") return

    const timer = window.setTimeout(() => {
      navigate(ROUTES.login, { replace: true })
    }, LOGIN_REDIRECT_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [navigate, phase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const errors = validateRecoveryPasswordFields({ newPassword, confirmPassword })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setPhase("submitting")

    try {
      await authService.completePasswordRecovery(newPassword, { keepSession: false })
      setPhase("success")
    } catch (error) {
      setPhase("form")
      setFormError(
        error instanceof Error ? error.message : "Unable to update password. Please try again."
      )
    }
  }

  if (isLocalAuth) {
    return (
      <div className="auth-form-page">
        <AuthFormMessage>
          Password recovery is unavailable in local auth mode. Use Change Password in Settings
          when signed in.
        </AuthFormMessage>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link to={ROUTES.login}>Back to sign in</Link>
        </Button>
      </div>
    )
  }

  if (phase === "checking") {
    return (
      <div className="auth-form-page">
        <div className="auth-form-header">
          <Heading level={1} size="section">
            Reset your password
          </Heading>
          <Text variant="muted" size="sm" className="max-w-none leading-6">
            Verifying your secure reset link…
          </Text>
        </div>
        <div className="flex items-center gap-2 text-sm text-foreground/70">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          One moment
        </div>
      </div>
    )
  }

  if (phase === "invalid") {
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
        <div className="auth-form-footer">
          <Text size="sm" variant="muted" className="max-w-none leading-6">
            Remember your password?{" "}
            <Link
              to={ROUTES.login}
              className="text-foreground/88 transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
          </Text>
          <AuthAboutLink />
        </div>
      </div>
    )
  }

  if (phase === "success") {
    return (
      <div className="auth-form-page">
        <div className="auth-form-success-panel">
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2
              className="size-11 text-[color-mix(in_srgb,#34d399_88%,white)]"
              aria-hidden
            />
            <Heading level={2} size="subsection">
              Password updated
            </Heading>
            <Text variant="muted" size="sm" className="max-w-none leading-6">
              Your Convertly password has been updated successfully. You can now sign in using
              your new password.
            </Text>
          </div>
          <Button asChild className="auth-form-submit h-10 w-full">
            <Link to={ROUTES.login}>Go to Login</Link>
          </Button>
          <Text variant="muted" size="sm" className="max-w-none text-center leading-6">
            Redirecting to sign in automatically…
          </Text>
        </div>
        <div className="auth-form-footer">
          <AuthAboutLink />
        </div>
      </div>
    )
  }

  const isSubmitting = phase === "submitting"

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
          label="New password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => {
            setNewPassword(event.target.value)
            if (fieldErrors.newPassword) {
              setFieldErrors((current) => ({ ...current, newPassword: undefined }))
            }
            if (formError) setFormError(null)
          }}
          error={fieldErrors.newPassword}
          hint={passwordHint}
          disabled={isSubmitting}
        />

        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value)
            if (fieldErrors.confirmPassword) {
              setFieldErrors((current) => ({ ...current, confirmPassword: undefined }))
            }
            if (formError) setFormError(null)
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
          Remember your password?{" "}
          <Link
            to={ROUTES.login}
            className="text-foreground/88 transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
        </Text>
        <AuthAboutLink />
      </div>
    </div>
  )
}

export default ResetPasswordPage
