import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { auditDetailPath } from "@/lib/routes"
import { cn } from "@/lib/utils"

type AuditTableLinkProps = {
  auditId: string
  children: ReactNode
  className?: string
}

function AuditTableLink({ auditId, children, className }: AuditTableLinkProps) {
  return (
    <Link
      to={auditDetailPath(auditId)}
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
