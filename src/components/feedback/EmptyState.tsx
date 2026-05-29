import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/surfaces/Card"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { cn } from "@/lib/utils"

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick?: () => void
    to?: string
  }
  className?: string
  children?: ReactNode
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "app-card-body flex flex-col items-center justify-center text-center hover:translate-y-0",
        className
      )}
    >
      <div className="mb-4 flex size-11 items-center justify-center rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color-mix(in_srgb,var(--surface)_70%,transparent)]">
        <Icon className="size-5 text-foreground/60" aria-hidden />
      </div>
      <Heading level={3} size="subsection" className="max-w-md text-xl">
        {title}
      </Heading>
      <Text variant="muted" size="sm" className="mt-2 max-w-md leading-6">
        {description}
      </Text>
      {children}
      {action ? (
        <div className="mt-6">
          {action.to ? (
            <Button size="sm" asChild>
              <Link to={action.to}>{action.label}</Link>
            </Button>
          ) : (
            <Button size="sm" type="button" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      ) : null}
    </Card>
  )
}

export { EmptyState }
