import type { ReactNode } from "react"

import { VertlyWidget } from "@/features/vertly/components/VertlyWidget"
import { VertlyProvider } from "@/features/vertly/context/VertlyProvider"
import type { VertlyVariant } from "@/features/vertly/types"

import "@/features/vertly/vertly.css"

type VertlyRootProps = {
  children?: ReactNode
  variant?: VertlyVariant
  userId?: string
  autoOpenSignupWelcome?: boolean
}

function VertlyRoot({
  children,
  variant = "authenticated",
  userId,
  autoOpenSignupWelcome = false,
}: VertlyRootProps) {
  return (
    <VertlyProvider
      variant={variant}
      userId={userId}
      autoOpenSignupWelcome={autoOpenSignupWelcome}
    >
      {children}
      <VertlyWidget />
    </VertlyProvider>
  )
}

export { VertlyRoot }
