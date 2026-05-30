import { cn } from "@/lib/utils"

function Sparkline({
  points,
  className,
  stroke = "var(--accent)",
}: {
  points: number[]
  className?: string
  stroke?: string
}) {
  const width = 120
  const height = 32
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1

  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width
      const y = height - ((point - min) / range) * (height - 4) - 2
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(" ")

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-8 w-full", className)}
      aria-hidden="true"
    >
      <path
        d={`${path} L ${width} ${height} L 0 ${height} Z`}
        fill="color-mix(in srgb, var(--accent) 14%, transparent)"
      />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ConfidenceIndicator({ value }: { value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.65rem] font-medium tracking-wide text-foreground/55 uppercase">
          Confidence
        </span>
        <span className="text-[0.65rem] font-medium tabular-nums text-foreground/78">
          {value}%
        </span>
      </div>
      <div className="h-1 rounded-full bg-[color-mix(in_srgb,var(--surface)_70%,black)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,color-mix(in_srgb,var(--accent)_88%,white),var(--accent))]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function UpliftBars({ values }: { values: number[] }) {
  const max = Math.max(...values)

  return (
    <div className="flex h-14 items-end gap-1.5">
      {values.map((value, index) => (
        <div key={index} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-sm bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent)_72%,white),var(--accent))]"
            style={{ height: `${(value / max) * 100}%`, minHeight: "0.5rem" }}
          />
          <span className="text-[0.58rem] text-foreground/45">{index + 1}w</span>
        </div>
      ))}
    </div>
  )
}

function PriorityBreakdown({
  high,
  medium,
  low,
}: {
  high: number
  medium: number
  low: number
}) {
  const total = high + medium + low

  return (
    <div className="space-y-2">
      <div className="flex h-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--surface)_70%,black)]">
        <div
          className="bg-[#f87171]"
          style={{ width: `${(high / total) * 100}%` }}
        />
        <div
          className="bg-[#fbbf24]"
          style={{ width: `${(medium / total) * 100}%` }}
        />
        <div
          className="bg-[color-mix(in_srgb,var(--accent)_70%,white)]"
          style={{ width: `${(low / total) * 100}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 text-[0.62rem] text-foreground/58">
        <span>High {high}</span>
        <span className="text-center">Med {medium}</span>
        <span className="text-right">Low {low}</span>
      </div>
    </div>
  )
}

function MonitoringHeatmap() {
  const cells = [
    0.2, 0.45, 0.7, 0.35, 0.9, 0.55, 0.25, 0.8, 0.4, 0.65, 0.3, 0.75,
    0.5, 0.85, 0.35, 0.6, 0.95, 0.42, 0.28, 0.72,
  ]

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-10 gap-1">
        {cells.map((opacity, index) => (
          <div
            key={index}
            className="aspect-square rounded-[0.2rem]"
            style={{
              background: `color-mix(in srgb, var(--accent) ${Math.round(opacity * 100)}%, transparent)`,
            }}
          />
        ))}
      </div>
      <div className="space-y-1">
        {["/pricing", "/signup", "/checkout"].map((page) => (
          <div
            key={page}
            className="flex items-center justify-between gap-2 text-[0.62rem] text-foreground/58"
          >
            <span className="truncate">{page}</span>
            <span className="shrink-0 text-[#86efac]">Active</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BeforeAfterBars({ before, after }: { before: number; after: number }) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[0.62rem] text-foreground/55">
          <span>Before</span>
          <span>{before}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[color-mix(in_srgb,var(--surface)_70%,black)]">
          <div
            className="h-full rounded-full bg-[color-mix(in_srgb,var(--muted)_35%,transparent)]"
            style={{ width: `${before}%` }}
          />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[0.62rem] text-foreground/55">
          <span>Projected</span>
          <span className="text-[#86efac]">{after}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[color-mix(in_srgb,var(--surface)_70%,black)]">
          <div
            className="h-full rounded-full bg-[var(--accent)]"
            style={{ width: `${after}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function EffortIndicator({ level }: { level: "Low" | "Medium" | "High" }) {
  const filled =
    level === "Low" ? 1 : level === "Medium" ? 2 : 3

  return (
    <div className="flex items-center gap-2">
      <span className="text-[0.62rem] tracking-wide text-foreground/55 uppercase">
        Effort
      </span>
      <div className="flex gap-1">
        {[1, 2, 3].map((segment) => (
          <span
            key={segment}
            className={cn(
              "h-1.5 w-4 rounded-full",
              segment <= filled
                ? "bg-[var(--accent)]"
                : "bg-[color-mix(in_srgb,var(--muted)_22%,transparent)]"
            )}
          />
        ))}
      </div>
      <span className="text-[0.62rem] text-foreground/62">{level}</span>
    </div>
  )
}

type AuthShowcaseMetricVisualProps = {
  metricId: string
}

function AuthShowcaseMetricVisual({ metricId }: AuthShowcaseMetricVisualProps) {
  if (metricId === "conversion-score") {
    return (
      <div className="space-y-3">
        <Sparkline points={[58, 61, 59, 64, 67, 66, 70, 72]} />
        <ConfidenceIndicator value={87} />
      </div>
    )
  }

  if (metricId === "revenue-opportunity") {
    return (
      <div className="space-y-2">
        <UpliftBars values={[28, 34, 41, 48, 52, 58]} />
        <div className="flex items-center justify-between text-[0.62rem] text-foreground/55">
          <span>Monthly uplift trend</span>
          <span className="text-[#86efac]">+18.4%</span>
        </div>
      </div>
    )
  }

  if (metricId === "open-opportunities") {
    return <PriorityBreakdown high={8} medium={11} low={4} />
  }

  if (metricId === "pages-monitored") {
    return <MonitoringHeatmap />
  }

  return null
}

export {
  AuthShowcaseMetricVisual,
  BeforeAfterBars,
  ConfidenceIndicator,
  EffortIndicator,
}
