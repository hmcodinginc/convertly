import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { Text } from "@/components/ui/typography/Text"
import type { BillingUsage } from "@/types/billing"

type UsageSummaryCardProps = {
  usage: BillingUsage | {
    auditsUsed: number
    auditsIncluded: number
    auditsRemaining: number
    period: "lifetime" | "month"
    periodEnd?: string | null
  }
  planName: string
}

function UsageSummaryCard({ usage, planName }: UsageSummaryCardProps) {
  const percent =
    usage.auditsIncluded > 0
      ? Math.round((usage.auditsUsed / usage.auditsIncluded) * 100)
      : 0

  const periodLabel =
    usage.period === "lifetime"
      ? "Lifetime allowance"
      : usage.periodEnd
        ? `Resets ${new Date(usage.periodEnd).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}`
        : "Monthly allowance"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Text size="sm" className="max-w-none font-medium">
          {planName} plan
        </Text>
        <StatusBadge
          label={usage.period === "lifetime" ? "Lifetime" : "Monthly"}
          variant="accent"
        />
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-medium tabular-nums tracking-tight text-foreground">
            {usage.auditsRemaining}
          </p>
          <Text variant="muted" size="sm" className="mt-1 max-w-none">
            of {usage.auditsIncluded} remaining
          </Text>
        </div>
        <Text size="sm" className="max-w-none tabular-nums text-foreground/75">
          {usage.auditsUsed} used
        </Text>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--surface)_80%,transparent)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <Text variant="muted" size="sm" className="max-w-none text-xs">
        {periodLabel}
      </Text>
    </div>
  )
}

export { UsageSummaryCard }
