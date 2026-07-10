import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type InfoGridProps = {
  columns?: 1 | 2
  children: ReactNode
  className?: string
}

function InfoGrid({ columns = 2, children, className }: InfoGridProps) {
  return (
    <div
      className={cn(
        "auth-doc-grid",
        columns === 2 && "auth-doc-grid--2",
        className
      )}
    >
      {children}
    </div>
  )
}

export { InfoGrid }
