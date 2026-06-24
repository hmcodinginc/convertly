import type { ReactNode } from "react"

import { Container } from "@/components/layout/Container"
import { cn } from "@/lib/utils"

type AppPageShellProps = {
  children: ReactNode
  header?: ReactNode
  className?: string
  sectionsClassName?: string
}

function AppPageShell({
  children,
  header,
  className,
  sectionsClassName,
}: AppPageShellProps) {
  return (
    <Container size="wide" className={cn("app-page", className)}>
      {header}
      <div className={cn("app-page-sections", sectionsClassName)}>{children}</div>
    </Container>
  )
}

export { AppPageShell }
