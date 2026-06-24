import type { MouseEvent, ReactNode } from "react"
import { Link } from "react-router-dom"

import { auditDetailPath } from "@/lib/routes"
import { cn } from "@/lib/utils"

type AuditTableLinkProps = {
  auditId: string
  children: ReactNode
  className?: string
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}

function AuditTableLink({ auditId, children, className, onClick }: AuditTableLinkProps) {
  return (
    <Link
      to={auditDetailPath(auditId)}
      onClick={onClick}
      className={cn(
        "font-medium text-foreground transition-colors hover:text-[color-mix(in_srgb,var(--accent)_75%,white)]",
        className
      )}
    >
      {children}
    </Link>
  )
}

export { AuditTableLink }
