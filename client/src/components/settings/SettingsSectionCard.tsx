import type { ReactNode } from "react"

import { SectionHeader } from "@/components/layout/SectionHeader"
import { Card } from "@/components/surfaces/Card"
import { cn } from "@/lib/utils"

type SettingsSectionCardProps = {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

function SettingsSectionCard({
  title,
  description,
  children,
  footer,
  className,
}: SettingsSectionCardProps) {
  return (
    <Card className={cn("app-card-body app-card-stack hover:translate-y-0", className)}>
      <SectionHeader variant="app" title={title} description={description} />
      {children}
      {footer ? <div className="pt-1">{footer}</div> : null}
    </Card>
  )
}

export { SettingsSectionCard }
