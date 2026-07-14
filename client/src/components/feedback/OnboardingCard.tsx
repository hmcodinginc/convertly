import { ArrowRight, Check } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/surfaces/Card"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { getPlanFeatureList } from "@/lib/planFeatures"
import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"
import type { AuditEntitlementCheck } from "@/types/entitlement"

type OnboardingCardProps = {
  entitlement: AuditEntitlementCheck
  className?: string
}

function OnboardingCard({ entitlement, className }: OnboardingCardProps) {
  const features = getPlanFeatureList(entitlement.planId)
  const remainingLabel = `${entitlement.auditsRemaining} / ${entitlement.auditsIncluded} remaining`

  return (
    <Card className={cn("overflow-hidden p-0 hover:translate-y-0", className)}>
      <div className="border-b border-[color-mix(in_srgb,var(--border)_65%,transparent)] px-6 py-6 sm:px-8">
        <Heading level={2} size="subsection" className="max-w-none text-xl">
          Run your first audit
        </Heading>
        <Text variant="muted" size="sm" className="mt-2 max-w-2xl leading-6">
          Your dashboard fills in once a completed audit finishes. Here&apos;s what your current
          plan includes.
        </Text>
      </div>

      <div className="grid gap-6 px-6 py-6 sm:grid-cols-[minmax(0,14rem)_1fr] sm:px-8 sm:py-7">
        <div className="space-y-4">
          <div className="space-y-1">
            <Text variant="muted" size="sm" className="max-w-none text-xs uppercase tracking-wide">
              Current plan
            </Text>
            <Text size="sm" className="max-w-none text-lg font-semibold text-foreground">
              {entitlement.planName}
            </Text>
          </div>
          <div className="space-y-1">
            <Text variant="muted" size="sm" className="max-w-none text-xs uppercase tracking-wide">
              Audits remaining
            </Text>
            <Text size="sm" className="max-w-none font-medium text-foreground">
              {remainingLabel}
            </Text>
          </div>
          {entitlement.periodEndFormatted ? (
            <div className="space-y-1">
              <Text variant="muted" size="sm" className="max-w-none text-xs uppercase tracking-wide">
                Next reset date
              </Text>
              <Text size="sm" className="max-w-none font-medium text-foreground">
                {entitlement.periodEndFormatted}
              </Text>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <Text variant="muted" size="sm" className="max-w-none text-xs uppercase tracking-wide">
            Features unlocked on your plan
          </Text>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-[color-mix(in_srgb,var(--accent)_75%,white)]"
                  aria-hidden
                />
                <Text size="sm" className="max-w-none leading-6 text-foreground/90">
                  {feature}
                </Text>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color-mix(in_srgb,var(--border)_65%,transparent)] px-6 py-5 sm:px-8">
        <Text variant="muted" size="sm" className="max-w-none">
          Most teams complete their first audit in under 5 minutes.
        </Text>
        <Button size="sm" asChild>
          <Link to={ROUTES.auditNew}>
            Run First Audit
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </Card>
  )
}

export { OnboardingCard }
