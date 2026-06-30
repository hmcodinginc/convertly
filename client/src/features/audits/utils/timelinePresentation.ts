import type { TimelineEvent } from "@/types/audit"

export type TimelinePageAnalysisGroup = {
  type: "page-analysis"
  id: string
  label: string
  events: TimelineEvent[]
  pageCount: number
  totalFindings: number
}

export type TimelineDisplayItem =
  | { type: "event"; event: TimelineEvent }
  | TimelinePageAnalysisGroup

const ANALYZED_PATTERN = /^Analyzed (\S+) — (\d+) finding/

export function buildTimelineDisplayItems(events: TimelineEvent[]): TimelineDisplayItem[] {
  const items: TimelineDisplayItem[] = []
  let analysisBuffer: TimelineEvent[] = []

  const flushAnalysis = () => {
    if (analysisBuffer.length === 0) return

    const totalFindings = analysisBuffer.reduce((sum, event) => {
      const match = event.label.match(ANALYZED_PATTERN)
      return sum + (match ? Number(match[2]) : 0)
    }, 0)

    items.push({
      type: "page-analysis",
      id: `analysis-${analysisBuffer[0]?.id ?? "group"}`,
      label: `Page analysis · ${analysisBuffer.length} pages`,
      events: analysisBuffer,
      pageCount: analysisBuffer.length,
      totalFindings,
    })
    analysisBuffer = []
  }

  for (const event of events) {
    if (ANALYZED_PATTERN.test(event.label)) {
      analysisBuffer.push(event)
      continue
    }

    flushAnalysis()
    items.push({ type: "event", event })
  }

  flushAnalysis()
  return items
}

export function formatAnalyzedPageLabel(label: string): { path: string; findings: number } | null {
  const match = label.match(ANALYZED_PATTERN)
  if (!match) return null
  return { path: match[1], findings: Number(match[2]) }
}
