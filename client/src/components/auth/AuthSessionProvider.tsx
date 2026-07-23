import * as React from "react"
import type { AuthChangeEvent } from "@supabase/supabase-js"

import { AuthSessionContext } from "@/components/auth/authSessionContext"
import { clearAuthSnapshot, setAuthSnapshot } from "@/lib/authSessionCache"
import { handleAuthSessionPaymentBoundary } from "@/lib/paymentSession"
import { shouldUseLocalAuth } from "@/lib/env"
import { bootstrapPasswordRecoveryFromUrl } from "@/lib/passwordRecoveryPersistence"
import * as accountService from "@/services/accountService"
import * as authService from "@/services/authService"
import { isBusinessFoundationEnabled } from "@/lib/businessFoundation"
import { ensureBusinessFoundation } from "@/services/businessBootstrapService"
import * as supabaseAuth from "@/services/auth/supabaseAuthProvider"
import type { AuthSession } from "@/types/auth"
import type { AccountInfo } from "@/types/account"

const SESSION_EVENTS = new Set<AuthChangeEvent>([
  "SIGNED_IN",
  "TOKEN_REFRESHED",
  "USER_UPDATED",
  "PASSWORD_RECOVERY",
])

function applyAuthState(
  setSession: React.Dispatch<React.SetStateAction<AuthSession | null>>,
  setAccount: React.Dispatch<React.SetStateAction<AccountInfo | null>>,
  state: { session: AuthSession | null; account: AccountInfo | null }
) {
  setSession(state.session)
  setAccount(state.account)
  setAuthSnapshot(state)
}

function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<AuthSession | null>(null)
  const [account, setAccount] = React.useState<AccountInfo | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const refreshInFlight = React.useRef<Promise<void> | null>(null)

  const refreshSession = React.useCallback(async () => {
    if (refreshInFlight.current) {
      await refreshInFlight.current
      return
    }

    const task = (async () => {
      const next = await authService.loadAuthState({ validate: true })
      let account = next.account
      if (account) {
        try {
          if (isBusinessFoundationEnabled()) {
            await ensureBusinessFoundation(account.userId)
          }
          account = (await accountService.getEnrichedAccount()) ?? account
        } catch {
          /* keep base account */
        }
      }
      applyAuthState(setSession, setAccount, { session: next.session, account })
    })()

    refreshInFlight.current = task

    try {
      await task
    } finally {
      refreshInFlight.current = null
    }
  }, [])

  const sessionUserIdRef = React.useRef<string | null>(null)

  const logout = React.useCallback(async () => {
    await authService.logout()
    handleAuthSessionPaymentBoundary(sessionUserIdRef.current, null)
    sessionUserIdRef.current = null
    setSession(null)
    setAccount(null)
    clearAuthSnapshot()
  }, [])

  React.useLayoutEffect(() => {
    if (shouldUseLocalAuth()) return
    bootstrapPasswordRecoveryFromUrl()
  }, [])

  React.useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      setIsLoading(true)
      try {
        const next = await authService.loadAuthState({ validate: true })
        if (!cancelled) {
          let account = next.account
          if (account) {
            try {
              if (isBusinessFoundationEnabled()) {
                await ensureBusinessFoundation(account.userId)
              }
              account = (await accountService.getEnrichedAccount()) ?? account
            } catch {
              /* bootstrap may fail offline — keep base account */
            }
          }
          applyAuthState(setSession, setAccount, { session: next.session, account })
          handleAuthSessionPaymentBoundary(sessionUserIdRef.current, next.session?.userId ?? null)
          sessionUserIdRef.current = next.session?.userId ?? null
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void bootstrap()

    if (shouldUseLocalAuth()) {
      return () => {
        cancelled = true
      }
    }

    const unsubscribeAuth = supabaseAuth.subscribeToAuthChanges((event, authSession) => {
      if (event === "INITIAL_SESSION") {
        return
      }

      if (event === "SIGNED_OUT") {
        handleAuthSessionPaymentBoundary(sessionUserIdRef.current, null)
        sessionUserIdRef.current = null
        setSession(null)
        setAccount(null)
        clearAuthSnapshot()
        return
      }

      if (!SESSION_EVENTS.has(event)) {
        return
      }

      const user = authSession?.user
      if (!user) {
        handleAuthSessionPaymentBoundary(sessionUserIdRef.current, null)
        sessionUserIdRef.current = null
        setSession(null)
        setAccount(null)
        return
      }

      // authStateFromUser hardcodes plan: "Free". Enrich from subscriptions/
      // overrides before painting Profile / Settings — otherwise TOKEN_REFRESHED
      // and USER_UPDATED wipe the real plan back to Free.
      void (async () => {
        const next = supabaseAuth.authStateFromUser(user)
        handleAuthSessionPaymentBoundary(sessionUserIdRef.current, next.session?.userId ?? null)
        sessionUserIdRef.current = next.session?.userId ?? null

        let account = next.account
        if (account) {
          try {
            if (isBusinessFoundationEnabled()) {
              await ensureBusinessFoundation(account.userId)
            }
            account = (await accountService.getEnrichedAccount()) ?? account
          } catch {
            /* keep base account if enrichment fails */
          }
        }

        applyAuthState(setSession, setAccount, {
          session: next.session,
          account,
        })
      })()
    })

    return () => {
      cancelled = true
      unsubscribeAuth()
    }
  }, [])

  const value = React.useMemo(
    () => ({
      session,
      account,
      isLoading,
      isAuthenticated: Boolean(session?.email),
      refreshSession,
      logout,
    }),
    [session, account, isLoading, refreshSession, logout]
  )

  return (
    <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
  )
}

export { AuthSessionProvider }
