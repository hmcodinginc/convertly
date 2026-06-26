import { Check, Clock } from "lucide-react"

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
    <Card className="audit-timeline audit-report-timeline app-card-metric h-full hover:translate-y-0">
      <Text
        variant="muted"
        size="sm"
        className="audit-timeline__heading max-w-none font-medium tracking-[0.14em] uppercase"
      >
        Audit timeline
      </Text>
      {events.length === 0 ? (
        <div className="audit-timeline__empty">
          <Clock className="mx-auto size-4 text-muted" aria-hidden />
          <Text variant="muted" size="sm" className="mt-2 max-w-none text-xs leading-5">
            Timeline events will appear as the audit progresses.
          </Text>
        </div>
      ) : (
        <ol className="audit-timeline__list">
          {events.map((event, index) => (
            <li key={event.id} className="audit-timeline__item">
              {index < events.length - 1 ? (
                <span className="audit-timeline__connector" aria-hidden />
              ) : null}
              <span
                className={cn(
                  "audit-timeline__marker",
                  event.status === "completed" && "audit-timeline__marker--completed"
                )}
              >
                {event.status === "completed" ? (
                  <Check className="size-2.5 text-foreground/70" aria-hidden />
                ) : (
                  <span className="size-1.5 rounded-full bg-muted" />
                )}
              </span>
              <div className="audit-timeline__content">
                <p className="audit-timeline__label">{event.label}</p>
                <Text variant="muted" size="sm" className="audit-timeline__time max-w-none text-xs">
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
