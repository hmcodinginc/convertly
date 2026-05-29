import type { ReactNode } from "react"

import { SectionHeader } from "@/components/layout/SectionHeader"
import { cn } from "@/lib/utils"

type AppPageSectionProps = {
  eyebrow?: string
  title?: string
  description?: string
  children: ReactNode
  className?: string
  actions?: ReactNode
  id?: string
}

function AppPageSection({
  eyebrow,
  title,
  description,
  children,
  className,
  actions,
  id,
}: AppPageSectionProps) {
  const hasHeader = Boolean(eyebrow || title || description)

  return (
    <section id={id} className={cn("app-section", className)}>
      {hasHeader ? (
        <div className="app-section-header-row">
          <SectionHeader
            variant="app"
            eyebrow={eyebrow}
            title={title}
            description={description}
          />
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export { AppPageSection }
