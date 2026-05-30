import * as React from "react"

import type { AuthLegalView } from "@/features/auth/content/authContent"

type AuthPanelContextValue = {
  activeLegal: AuthLegalView | null
  openLegal: (view: AuthLegalView) => void
  closeLegal: () => void
}

const AuthPanelContext = React.createContext<AuthPanelContextValue | null>(null)

function AuthPanelProvider({ children }: { children: React.ReactNode }) {
  const [activeLegal, setActiveLegal] = React.useState<AuthLegalView | null>(null)

  const value = React.useMemo(
    () => ({
      activeLegal,
      openLegal: setActiveLegal,
      closeLegal: () => setActiveLegal(null),
    }),
    [activeLegal]
  )

  return <AuthPanelContext.Provider value={value}>{children}</AuthPanelContext.Provider>
}

function useAuthPanel() {
  const context = React.useContext(AuthPanelContext)
  if (!context) {
    throw new Error("useAuthPanel must be used within AuthPanelProvider")
  }
  return context
}

export { AuthPanelProvider, useAuthPanel }
