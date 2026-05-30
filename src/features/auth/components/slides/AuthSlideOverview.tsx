import { AuthShowcaseMetric } from "@/features/auth/components/AuthShowcaseMetric"
import { AuthSlideFrame } from "@/features/auth/components/AuthSlideFrame"
import { dashboardMetrics } from "@/features/dashboard/data/mockData"
import { AUTH_SHOWCASE_SLIDES } from "@/features/auth/content/authContent"

const slide = AUTH_SHOWCASE_SLIDES[0]

function AuthSlideOverview() {
  return (
    <AuthSlideFrame
      eyebrow={slide.eyebrow}
      title={slide.title}
      description={slide.description}
    >
      <div className="grid h-full grid-cols-2 gap-2.5">
        {dashboardMetrics.map((metric) => (
          <AuthShowcaseMetric key={metric.id} metric={metric} compact />
        ))}
      </div>
    </AuthSlideFrame>
  )
}

export { AuthSlideOverview }
