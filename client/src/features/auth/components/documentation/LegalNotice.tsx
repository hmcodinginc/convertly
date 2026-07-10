import type { ReactNode } from "react"

function LegalNotice({ children }: { children: ReactNode }) {
  return <p className="auth-doc-notice">{children}</p>
}

export { LegalNotice }
