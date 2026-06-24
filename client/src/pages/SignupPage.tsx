import { Loader2 } from "lucide-react"
import { useMemo, useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { AuthAboutLink, AuthLegalLinks } from "@/components/auth/AuthLegalLinks"
import { TextField } from "@/components/forms/TextField"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { validateSignupFields, type SignupField } from "@/lib/authValidation"
import { ROUTES } from "@/lib/routes"
import * as authService from "@/services/authService"

function SignupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<SignupField, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo = (location.state as { from?: string } | null)?.from ?? ROUTES.dashboard
  const canSubmit = acceptedTerms && !isSubmitting

  const passwordHint = useMemo(
    () =>
      "Minimum 8 characters with uppercase, lowercase, number, and special character.",
    []
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const errors = validateSignupFields({
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    })

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    if (!acceptedTerms) return

    setIsSubmitting(true)

    try {
      await authService.signup({
        firstName,
        lastName,
        email,
        password,
      })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to create account.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-form-page">
      <div className="auth-form-header">
        <Heading level={1} size="section">
          Create your account
        </Heading>
        <Text variant="muted" size="sm" className="max-w-none leading-6">
          Start analyzing conversion opportunities with Convertly in minutes.
        </Text>
      </div>

      <form className="auth-form-stack" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
        </div>

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (fieldErrors.email) {
              setFieldErrors((current) => ({ ...current, email: undefined }))
            }
          }}
          error={fieldErrors.email}
          disabled={isSubmitting}
        />

        <TextField
          label="Password"
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
          hint={passwordHint}
          disabled={isSubmitting}
        />

        <TextField
          label="Confirm Password"
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

        <div className="auth-form-terms">
          <Checkbox
            id="signup-terms"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            disabled={isSubmitting}
            className="auth-form-terms-checkbox"
          />
          <Label htmlFor="signup-terms" className="auth-form-terms-label">
            I agree to the <AuthLegalLinks />.
          </Label>
        </div>

        {formError ? <AuthFormMessage>{formError}</AuthFormMessage> : null}

        <Button type="submit" className="auth-form-submit h-10 w-full" disabled={!canSubmit}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Creating account…
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <div className="auth-form-footer">
        <Text size="sm" variant="muted" className="max-w-none leading-6">
          Already have an account?{" "}
          <Link
            to={ROUTES.login}
            state={location.state}
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

export default SignupPage
