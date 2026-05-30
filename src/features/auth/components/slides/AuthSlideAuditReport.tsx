import { AuthShowcaseMetric } from "@/features/auth/components/AuthShowcaseMetric"
import { AuthSlideFrame } from "@/features/auth/components/AuthSlideFrame"
import { Card } from "@/components/surfaces/Card"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { AUTH_SHOWCASE_SLIDES } from "@/features/auth/content/authContent"
import { dashboardMetrics } from "@/features/dashboard/data/mockData"

const slide = AUTH_SHOWCASE_SLIDES[1]

const auditMetrics = [
  dashboardMetrics.find((m) => m.id === "conversion-score")!,
  dashboardMetrics.find((m) => m.id === "revenue-opportunity")!,
  dashboardMetrics.find((m) => m.id === "open-opportunities")!,
  {
    id: "recommendation-confidence",
    label: "Recommendation confidence",
    value: "87%",
    change: "+4%",
    trend: "up" as const,
    hint: "Model certainty on top fixes",
  },
]

function AuthSlideAuditReport() {
  return (
    <AuthSlideFrame
      eyebrow={slide.eyebrow}
      title={slide.title}
      description={slide.description}
    >
      <div className="flex h-full flex-col gap-2.5">
        <Card className="auth-showcase-feature hover:translate-y-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Text variant="muted" size="sm" className="max-w-none text-xs font-medium uppercase">
                Q2 Growth funnel · acme.io
              </Text>
              <Heading level={3} size="subsection" className="mt-1">
                Conversion score
              </Heading>
            </div>
            <p className="text-4xl font-medium tabular-nums tracking-tight text-foreground">78</p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--surface)_70%,black)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,color-mix(in_srgb,var(--accent)_92%,white),var(--accent))]"
              style={{ width: "78%" }}
            />
          </div>
        </Card>

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-2.5">
          {auditMetrics.map((metric) => (
            <AuthShowcaseMetric key={metric.id} metric={metric} compact />
          ))}
        </div>
      </div>
    </AuthSlideFrame>
  )
}

export { AuthSlideAuditReport }
