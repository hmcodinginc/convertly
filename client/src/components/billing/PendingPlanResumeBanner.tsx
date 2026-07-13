import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography/Text"
import type { PendingPlanChange } from "@/types/billing"

type PendingPlanResumeBannerProps = {
  pendingPlan: PendingPlanChange
  isLoading?: boolean
  onSubscribe: () => void
  onDismiss: () => void
}

function PendingPlanResumeBanner({
  pendingPlan,
  isLoading = false,
  onSubscribe,
  onDismiss,
}: PendingPlanResumeBannerProps) {
  return (
    <div className="relative rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--accent)_24%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface))] px-5 py-4 shadow-[var(--shadow-soft)]">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-[var(--radius-md)] text-foreground/60 transition-colors hover:bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="size-4" aria-hidden />
      </button>
      <div className="flex flex-col gap-4 pr-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Text size="sm" className="max-w-none font-medium text-foreground">
            Your previous subscription has ended.
          </Text>
          <Text size="sm" className="max-w-none text-muted">
            Continue with your selected {pendingPlan.planName} plan.
          </Text>
        </div>
        <Button size="sm" onClick={onSubscribe} disabled={isLoading} className="shrink-0">
          {isLoading ? "Opening checkout…" : "Subscribe Now"}
        </Button>
      </div>
    </div>
  )
}

export { PendingPlanResumeBanner }
