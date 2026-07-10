import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

type DocumentationSectionProps = {
  id?: string
  title: string
  icon?: LucideIcon
  children: ReactNode
}

function DocumentationSection({ id, title, icon: Icon, children }: DocumentationSectionProps) {
  return (
    <section className="auth-doc-section" aria-labelledby={id ? `${id}-heading` : undefined}>
      <div className="auth-doc-section__header">
        {Icon ? (
          <span className="auth-doc-section__icon" aria-hidden>
            <Icon className="size-3.5" />
          </span>
        ) : null}
        <h3
          id={id ? `${id}-heading` : undefined}
          className="auth-doc-section__title"
        >
          {title}
        </h3>
      </div>
      <div className="auth-doc-section__body">{children}</div>
    </section>
  )
}

export { DocumentationSection }
