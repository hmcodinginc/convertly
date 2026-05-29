import type { ReactNode } from "react"

import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { cn } from "@/lib/utils"

type AppPageHeaderProps = {
  title: string
  description?: string
  eyebrow?: string
  actions?: ReactNode
  className?: string
}

function AppPageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: AppPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] pb-6 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="space-y-2">
        {eyebrow ? (
          <Text
            variant="muted"
            size="sm"
            className="max-w-none font-medium tracking-[0.16em] uppercase"
          >
            {eyebrow}
          </Text>
        ) : null}
        <Heading level={1} size="subsection" className="max-w-none">
          {title}
        </Heading>
        {description ? (
          <Text variant="muted" size="sm" className="max-w-2xl">
            {description}
          </Text>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export { AppPageHeader }
