import { Loader2 } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"

import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { AuthAboutLink } from "@/components/auth/AuthLegalLinks"
import { TextField } from "@/components/forms/TextField"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { validateEmail } from "@/lib/authValidation"
import { ROUTES } from "@/lib/routes"
import * as authService from "@/services/authService"

function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const nextEmailError = validateEmail(email)
    setEmailError(nextEmailError)
    if (nextEmailError) return

    setIsSubmitting(true)

    try {
      await authService.requestPasswordReset({ email })
      setIsSubmitted(true)
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to process reset request."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-form-page">
      <div className="auth-form-header">
        <Heading level={1} size="section">
          Reset your password
        </Heading>
        <Text variant="muted" size="sm" className="max-w-none leading-6">
          Enter your email and we&apos;ll send reset instructions when password recovery is
          enabled.
        </Text>
      </div>

      {isSubmitted ? (
        <div className="auth-form-success-panel">
          <AuthFormMessage variant="success">
            If an account exists for {email}, reset instructions will be sent shortly.
          </AuthFormMessage>
          <Button asChild className="auth-form-submit h-10 w-full">
            <Link to={ROUTES.login}>Back to sign in</Link>
          </Button>
        </div>
      ) : (
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

          {formError ? <AuthFormMessage>{formError}</AuthFormMessage> : null}

          <Button type="submit" className="auth-form-submit h-10 w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Sending…
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      )}

      <div className="auth-form-footer">
        <Text size="sm" variant="muted" className="max-w-none leading-6">
          Remember your password?{" "}
          <Link to={ROUTES.login} className="text-foreground/88 transition-colors hover:text-foreground">
            Sign in
          </Link>
        </Text>
        <AuthAboutLink />
      </div>
    </div>
  )
}

export default ForgotPasswordPage
