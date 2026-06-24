import { Loader2 } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { AuthAboutLink } from "@/components/auth/AuthLegalLinks"
import { TextField } from "@/components/forms/TextField"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { validateEmail, validateRequired } from "@/lib/authValidation"
import { ROUTES } from "@/lib/routes"
import * as authService from "@/services/authService"

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo = (location.state as { from?: string } | null)?.from ?? ROUTES.dashboard
  const passwordWasReset =
    (location.state as { passwordReset?: boolean } | null)?.passwordReset === true

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const nextEmailError = validateEmail(email)
    const nextPasswordError = validateRequired(password, "Password")

    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)

    if (nextEmailError || nextPasswordError) return

    setIsSubmitting(true)

    try {
      await authService.login({ email, password })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to sign in.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-form-page">
      <div className="auth-form-header">
        <Heading level={1} size="section">
          Welcome back
        </Heading>
        <Text variant="muted" size="sm" className="max-w-none leading-6">
          Sign in to access your audits, workspace, and conversion insights.
        </Text>
      </div>

      {passwordWasReset ? (
        <AuthFormMessage variant="success">
          Password updated. Sign in with your new password.
        </AuthFormMessage>
      ) : null}

      <form className="auth-form-stack" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (emailError) setEmailError(null)
            if (formError) setFormError(null)
          }}
          error={emailError}
          disabled={isSubmitting}
        />

        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            if (passwordError) setPasswordError(null)
            if (formError) setFormError(null)
          }}
          error={passwordError}
          disabled={isSubmitting}
        />

        <div className="auth-form-inline-link">
          <Link
            to={ROUTES.forgotPassword}
            className="min-h-11 py-2 text-sm leading-6 text-foreground/62 transition-colors hover:text-foreground"
          >
            Forgot password?
          </Link>
        </div>

        {formError ? <AuthFormMessage>{formError}</AuthFormMessage> : null}

        <Button type="submit" className="auth-form-submit h-10 w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <div className="auth-form-footer">
        <Text size="sm" variant="muted" className="max-w-none leading-6">
          Don&apos;t have an account?{" "}
          <Link
            to={ROUTES.signup}
            state={location.state}
            className="text-foreground/88 transition-colors hover:text-foreground"
          >
            Create one
          </Link>
        </Text>
        <AuthAboutLink />
      </div>
    </div>
  )
}

export default LoginPage
