import { Section } from "@/components/layout/Section"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { FadeIn } from "@/components/motion/FadeIn"
import { Card } from "@/components/surfaces/Card"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { cn } from "@/lib/utils"

const features = [
  {
    title: "Conversion Signals",
    description:
      "Surface the clearest friction points and intent gaps across your most valuable journeys.",
    className:
      "relative overflow-hidden sm:col-span-2 lg:col-span-2 lg:row-span-2 bg-[color-mix(in_srgb,var(--surface)_86%,transparent)]",
    visual: "hero",
  },
  {
    title: "Priority Queue",
    description:
      "Rank opportunities by likely impact so teams know exactly what to ship first.",
    className:
      "relative overflow-hidden bg-[color-mix(in_srgb,var(--surface)_72%,transparent)]",
    visual: "queue",
  },
  {
    title: "AI Guidance",
    description:
      "Turn findings into concise recommendations with clear ownership and implementation direction.",
    className:
      "relative overflow-hidden sm:col-span-2 lg:col-span-1 bg-[color-mix(in_srgb,var(--surface)_66%,transparent)]",
    visual: "guidance",
  },
  {
    title: "Execution Visibility",
    description:
      "Keep product and growth aligned with a shared view of progress, status, and expected lift.",
    className:
      "relative overflow-hidden bg-[color-mix(in_srgb,var(--surface)_68%,transparent)]",
    visual: "progress",
  },
]

function FeaturesSection() {
  return (
    <Section aria-labelledby="features-title" containerClassName="marketing-container">
      <div className="marketing-section-stack">
        <FadeIn>
          <SectionHeader
            eyebrow="Product"
            title="Features built for focused growth execution"
            titleId="features-title"
            description="A clean system of analysis and prioritization designed to help teams ship higher-converting experiences."
          />
        </FadeIn>

        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FadeIn key={feature.title} delay={0.05 + index * 0.05}>
              <Card
                className={cn(
                  "marketing-card h-full border-[color-mix(in_srgb,var(--border)_90%,transparent)] hover:translate-y-0",
                  feature.className
                )}
              >
                {feature.visual === "hero" ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_55%)]"
                  />
                ) : null}

                <div className="relative flex h-full flex-col gap-6">
                  <div className="space-y-3">
                    <Heading
                      level={3}
                      size={feature.visual === "hero" ? "section" : "subsection"}
                    >
                      {feature.title}
                    </Heading>
                    <Text variant="muted" size="sm" className="max-w-none leading-6">
                      {feature.description}
                    </Text>
                  </div>

                  {feature.visual === "hero" ? (
                    <div className="mt-auto space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="marketing-tile border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)]">
                          <Text size="sm" variant="muted" className="max-w-none">
                            Intent Match
                          </Text>
                          <Heading level={4} size="subsection" className="mt-1">
                            +28%
                          </Heading>
                        </div>
                        <div className="marketing-tile border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)]">
                          <Text size="sm" variant="muted" className="max-w-none">
                            Friction Reduced
                          </Text>
                          <Heading level={4} size="subsection" className="mt-1">
                            -19%
                          </Heading>
                        </div>
                      </div>
                      <div className="marketing-tile border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)]">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <Text size="sm" variant="muted" className="max-w-none">
                            Recommendation Confidence
                          </Text>
                          <Text size="sm" className="max-w-none">
                            87%
                          </Text>
                        </div>
                        <div className="h-1.5 rounded-full bg-[color-mix(in_srgb,var(--surface)_70%,black)]">
                          <div className="h-full w-[87%] rounded-full bg-[var(--accent)]" />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {feature.visual === "queue" ? (
                    <div className="mt-auto space-y-2">
                      {["Homepage friction", "Pricing clarity", "Form completion"].map(
                        (item, itemIndex) => (
                          <div
                            key={item}
                            className="flex items-center justify-between gap-3 marketing-tile border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)]"
                          >
                            <Text size="sm" variant="muted" className="max-w-none">
                              {item}
                            </Text>
                            <Text size="sm" className="max-w-none shrink-0">
                              P{itemIndex + 1}
                            </Text>
                          </div>
                        )
                      )}
                    </div>
                  ) : null}

                  {feature.visual === "guidance" ? (
                    <div className="marketing-tile mt-auto border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)]">
                      <Text size="sm" className="max-w-none">
                        AI analysis fragment
                      </Text>
                      <div className="mt-2 space-y-1.5">
                        <div className="h-2 w-[90%] rounded-full bg-[color-mix(in_srgb,var(--muted)_26%,transparent)]" />
                        <div className="h-2 w-[72%] rounded-full bg-[color-mix(in_srgb,var(--muted)_20%,transparent)]" />
                        <div className="h-2 w-[84%] rounded-full bg-[color-mix(in_srgb,var(--muted)_16%,transparent)]" />
                      </div>
                    </div>
                  ) : null}

                  {feature.visual === "progress" ? (
                    <div className="mt-auto space-y-3">
                      <div className="marketing-tile border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)]">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <Text size="sm" variant="muted" className="max-w-none">
                            Rollout Progress
                          </Text>
                          <Text size="sm" className="max-w-none">
                            64%
                          </Text>
                        </div>
                        <div className="h-1.5 rounded-full bg-[color-mix(in_srgb,var(--surface)_72%,black)]">
                          <div className="h-full w-[64%] rounded-full bg-[color-mix(in_srgb,var(--accent)_78%,white)]" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="marketing-tile border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] text-center">
                          <Text size="sm" className="max-w-none">
                            12
                          </Text>
                        </div>
                        <div className="marketing-tile border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] text-center">
                          <Text size="sm" className="max-w-none">
                            4 In Review
                          </Text>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </Section>
  )
}

export { FeaturesSection }
