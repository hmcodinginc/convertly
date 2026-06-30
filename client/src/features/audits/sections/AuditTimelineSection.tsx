import { Check, ChevronDown, Clock } from "lucide-react"
import { useMemo, useState } from "react"

import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import {
  buildTimelineDisplayItems,
  formatAnalyzedPageLabel,
} from "@/features/audits/utils/timelinePresentation"
import type { TimelineEvent } from "@/types/audit"
import { cn } from "@/lib/utils"

type AuditTimelineSectionProps = {
  events: TimelineEvent[]
  compact?: boolean
}

function TimelineEventRow({ event }: { event: TimelineEvent }) {
  return (
    <div className="audit-timeline__content">
      <p className="audit-timeline__label">{event.label}</p>
      <Text variant="muted" size="sm" className="audit-timeline__time max-w-none text-xs">
        {event.timestamp}
      </Text>
    </div>
  )
}

function PageAnalysisGroup({
  group,
  defaultExpanded,
}: {
  group: Extract<ReturnType<typeof buildTimelineDisplayItems>[number], { type: "page-analysis" }>
  defaultExpanded: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <li className="audit-timeline__item audit-timeline__item--group">
      <span className="audit-timeline__connector audit-timeline__connector--group" aria-hidden />
      <span className="audit-timeline__marker audit-timeline__marker--completed">
        <Check className="size-2.5 text-foreground/70" aria-hidden />
      </span>
      <div className="audit-timeline__group min-w-0 flex-1">
        <button
          type="button"
          className="audit-timeline__group-trigger"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          <div className="min-w-0 text-left">
            <p className="audit-timeline__label">{group.label}</p>
            <Text variant="muted" size="sm" className="audit-timeline__time max-w-none text-xs">
              {group.totalFindings} finding{group.totalFindings === 1 ? "" : "s"} across{" "}
              {group.pageCount} pages
            </Text>
          </div>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-foreground/45 transition-transform duration-[var(--motion-fast)]",
              expanded && "rotate-180"
            )}
            aria-hidden
          />
        </button>
        {expanded ? (
          <ul className="audit-timeline__group-list">
            {group.events.map((event) => {
              const parsed = formatAnalyzedPageLabel(event.label)
              return (
                <li key={event.id} className="audit-timeline__group-item">
                  <span className="audit-timeline__group-path">
                    {parsed?.path ?? event.label}
                  </span>
                  <span className="audit-timeline__group-meta">
                    {parsed ? `${parsed.findings} findings` : event.timestamp}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </li>
  )
}

function AuditTimelineSection({ events, compact = false }: AuditTimelineSectionProps) {
  const displayItems = useMemo(() => buildTimelineDisplayItems(events), [events])

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
          {displayItems.map((item, index) => {
            if (item.type === "page-analysis") {
              return (
                <PageAnalysisGroup
                  key={item.id}
                  group={item}
                  defaultExpanded={index === displayItems.length - 1}
                />
              )
            }

            const event = item.event
            return (
              <li key={event.id} className="audit-timeline__item">
                {index < displayItems.length - 1 ? (
                  <span className="audit-timeline__connector" aria-hidden />
                ) : null}
                <span
                  className={cn(
                    "audit-timeline__marker",
                    event.status === "completed" && "audit-timeline__marker--completed",
                    event.status === "in_progress" && "audit-timeline__marker--active"
                  )}
                >
                  {event.status === "completed" ? (
                    <Check className="size-2.5 text-foreground/70" aria-hidden />
                  ) : (
                    <span className="size-1.5 rounded-full bg-muted" />
                  )}
                </span>
                <TimelineEventRow event={event} />
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}

export { AuditTimelineSection }
