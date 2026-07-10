import type { ReactNode } from "react"

type DocumentationCardProps = {
  title: string
  children: ReactNode
}

function DocumentationCard({ title, children }: DocumentationCardProps) {
  return (
    <article className="auth-doc-card">
      <h4 className="auth-doc-card__title">{title}</h4>
      <div className="auth-doc-card__body">{children}</div>
    </article>
  )
}

export { DocumentationCard }
