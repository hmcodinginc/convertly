import * as React from "react"

import { shouldUseLocalAuth } from "@/lib/env"
import * as authService from "@/services/authService"
import * as supabaseAuth from "@/services/auth/supabaseAuthProvider"
import type { AuthSession } from "@/types/auth"
import type { AccountInfo } from "@/types/account"

type AuthSessionContextValue = {
  session: AuthSession | null
  account: AccountInfo | null
  isLoading: boolean
  isAuthenticated: boolean
  refreshSession: () => Promise<void>
  logout: () => Promise<void>
}

const AuthSessionContext = React.createContext<AuthSessionContextValue | null>(null)

function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<AuthSession | null>(null)
  const [account, setAccount] = React.useState<AccountInfo | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const refreshSession = React.useCallback(async () => {
    setIsLoading(true)

    try {
      const nextSession = await authService.validateSession()
      setSession(nextSession)

      if (nextSession) {
        const nextAccount = await authService.getAccount()
        setAccount(nextAccount)
      } else {
        setAccount(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = React.useCallback(async () => {
    await authService.logout()
    setSession(null)
    setAccount(null)
  }, [])

  React.useEffect(() => {
    void refreshSession()

    if (shouldUseLocalAuth()) {
      return
    }

    const unsubscribe = supabaseAuth.subscribeToAuthChanges(() => {
      void refreshSession()
    })

    return unsubscribe
  }, [refreshSession])

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

function useAuthSession() {
  const context = React.useContext(AuthSessionContext)
  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider")
  }
  return context
}

export { AuthSessionProvider, useAuthSession }
