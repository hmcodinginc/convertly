import { useEffect, useLayoutEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { shouldUseLocalAuth } from "@/lib/env"
import { bootstrapPasswordRecoveryFromUrl } from "@/lib/passwordRecoveryPersistence"
import { ROUTES } from "@/lib/routes"
import * as authService from "@/services/authService"

function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isRecoveryReady, setIsRecoveryReady] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useLayoutEffect(() => {
    if (shouldUseLocalAuth()) return
    bootstrapPasswordRecoveryFromUrl()
  }, [])

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

  useEffect(() => {
    if (!isRecoveryReady || isCheckingSession) return
    navigate(
      { pathname: ROUTES.profile, hash: location.hash, search: location.search },
      { replace: true }
    )
  }, [isRecoveryReady, isCheckingSession, location.hash, location.search, navigate])

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
      <Text variant="muted" size="sm" className="max-w-none">
        Redirecting to your profile…
      </Text>
    </div>
  )
}

export default ResetPasswordPage
