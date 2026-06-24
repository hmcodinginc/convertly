import * as React from "react"

import { useAuthPanel } from "@/components/auth/AuthPanelContext"
import type { AuthLegalView } from "@/features/auth/content/authContent"
import { cn } from "@/lib/utils"

type AuthLegalLinksProps = {
  className?: string
}

function AuthLegalLink({
  view,
  children,
}: {
  view: AuthLegalView
  children: React.ReactNode
}) {
  const { openLegal } = useAuthPanel()

  return (
    <button
      type="button"
      onClick={() => openLegal(view)}
      className="text-[var(--accent)] underline-offset-4 transition-colors hover:text-foreground hover:underline"
    >
      {children}
    </button>
  )
}

function AuthLegalLinks({ className }: AuthLegalLinksProps) {
  return (
    <span className={cn("text-foreground/70", className)}>
      <AuthLegalLink view="terms">Terms & Conditions</AuthLegalLink>
      {" and "}
      <AuthLegalLink view="privacy">Privacy Policy</AuthLegalLink>
    </span>
  )
}

function AuthAboutLink({ className }: AuthLegalLinksProps) {
  const { openLegal } = useAuthPanel()

  return (
    <button
      type="button"
      onClick={() => openLegal("about")}
      className={cn(
        "min-h-11 py-2 text-left text-sm leading-6 text-foreground/62 transition-colors hover:text-foreground/90",
        className
      )}
    >
      About Convertly
    </button>
  )
}

export { AuthAboutLink, AuthLegalLink, AuthLegalLinks }
