import { AlertCircle, Loader2 } from "lucide-react"
import type { ReactNode } from "react"

import { EmptyState } from "@/components/feedback/EmptyState"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"

type PageLoadingProps = {
  label?: string
}

function PageLoading({ label = "Loading…" }: PageLoadingProps) {
  return (
    <Card className="app-card-body flex items-center justify-center gap-3 hover:translate-y-0">
      <Loader2 className="size-4 animate-spin text-muted" aria-hidden />
      <Text variant="muted" size="sm" className="max-w-none">
        {label}
      </Text>
    </Card>
  )
}

type PageErrorProps = {
  title?: string
  description?: string
  onRetry?: () => void
  children?: ReactNode
}

function PageError({
  title = "Unable to load data",
  description = "Please try again. If the problem persists, contact support.",
  onRetry,
  children,
}: PageErrorProps) {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      action={
        onRetry
          ? {
              label: "Try again",
              onClick: onRetry,
            }
          : undefined
      }
    >
      {children}
    </EmptyState>
  )
}

export { PageError, PageLoading }
