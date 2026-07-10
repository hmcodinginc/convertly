import { Info, AlertTriangle } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type CalloutProps = {
  variant?: "info" | "warning"
  title?: string
  children: ReactNode
}

function Callout({ variant = "info", title, children }: CalloutProps) {
  const Icon = variant === "warning" ? AlertTriangle : Info

  return (
    <aside
      className={cn(
        "auth-doc-callout",
        variant === "warning" ? "auth-doc-callout--warning" : "auth-doc-callout--info"
      )}
      role="note"
    >
      <Icon className="auth-doc-callout__icon size-4" aria-hidden />
      <div className="auth-doc-callout__content">
        {title ? <p className="auth-doc-callout__title">{title}</p> : null}
        <div className="auth-doc-callout__body">{children}</div>
      </div>
    </aside>
  )
}

export { Callout }
