import { Check, Clock } from "lucide-react"

import { EmptyState } from "@/components/feedback/EmptyState"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import type { TimelineEvent } from "@/types/audit"
import { cn } from "@/lib/utils"

type AuditTimelineSectionProps = {
  events: TimelineEvent[]
  compact?: boolean
}

function AuditTimelineSection({ events, compact = false }: AuditTimelineSectionProps) {
  if (!compact) return null

  return (
    <Card className="app-card-metric h-full hover:translate-y-0">
      <Text
        variant="muted"
        size="sm"
        className="mb-4 max-w-none font-medium tracking-[0.16em] uppercase"
      >
        Audit timeline
      </Text>
      {events.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No timeline events"
          description="No timeline events have been recorded for this audit yet."
        />
      ) : (
        <ol className="space-y-0">
          {events.map((event, index) => (
            <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
              {index < events.length - 1 ? (
                <span
                  className="absolute left-[0.6875rem] top-6 bottom-0 w-px bg-[color-mix(in_srgb,var(--border)_70%,transparent)]"
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "relative z-[1] flex size-[1.375rem] shrink-0 items-center justify-center rounded-full border",
                  event.status === "completed"
                    ? "border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_14%,var(--surface))]"
                    : "border-[color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color-mix(in_srgb,var(--surface)_60%,transparent)]"
                )}
              >
                {event.status === "completed" ? (
                  <Check className="size-3 text-foreground/80" aria-hidden />
                ) : (
                  <span className="size-1.5 rounded-full bg-muted" />
                )}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-foreground">{event.label}</p>
                <Text variant="muted" size="sm" className="mt-0.5 max-w-none text-xs">
                  {event.timestamp}
                </Text>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}

export { AuditTimelineSection }
