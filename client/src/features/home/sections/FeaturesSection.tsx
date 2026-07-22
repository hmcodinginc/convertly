import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Section } from "@/components/layout/Section"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { FadeIn } from "@/components/motion/FadeIn"
import { Card } from "@/components/surfaces/Card"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { cn } from "@/lib/utils"

function ABTestVisual() {
  const [activeTab, setActiveTab] = useState<"A" | "B">("B")

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev === "A" ? "B" : "A"))
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] rounded-xl p-3 sm:p-3.5 overflow-hidden flex flex-col gap-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex items-center justify-between border-b border-[color-mix(in_srgb,var(--border)_50%,transparent)] pb-2">
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="text-[0.6rem] font-bold tracking-widest text-foreground/60 uppercase">
            A/B Copy Optimization
          </span>
        </div>
        <div className="flex gap-1 bg-[color-mix(in_srgb,var(--surface)_60%,black)] p-0.5 rounded-md border border-[var(--border)]">
          <button
            onClick={() => setActiveTab("A")}
            className={cn(
              "px-2 py-0.5 text-[0.6rem] font-bold rounded-sm transition-all cursor-pointer",
              activeTab === "A"
                ? "bg-[color-mix(in_srgb,var(--border)_80%,transparent)] text-foreground shadow-sm"
                : "text-foreground/50 hover:text-foreground"
            )}
          >
            A
          </button>
          <button
            onClick={() => setActiveTab("B")}
            className={cn(
              "px-2 py-0.5 text-[0.6rem] font-bold rounded-sm transition-all cursor-pointer",
              activeTab === "B"
                ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm"
                : "text-foreground/50 hover:text-foreground"
            )}
          >
            B
          </button>
        </div>
      </div>

      <div className="relative min-h-[4rem] flex flex-col justify-center">
        {activeTab === "A" ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.55rem] font-extrabold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Control (Variant A)
              </span>
              <span className="text-[0.55rem] font-semibold text-foreground/50">
                Conv: 1.4%
              </span>
            </div>
            <div className="text-[0.72rem] font-medium text-foreground/68 leading-normal pl-2 border-l-2 border-red-500/35">
              "Get started with our standard business software solutions today."
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.55rem] font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Convertly AI (Variant B)
              </span>
              <span className="text-[0.55rem] font-extrabold text-emerald-400">
                Conv: 3.2% (+12.4% Lift)
              </span>
            </div>
            <div className="text-[0.72rem] font-semibold text-foreground leading-normal pl-2 border-l-2 border-[var(--accent)]">
              "Turn more website visitors into revenue, with clarity and speed."
            </div>
          </motion.div>
        )}

        <motion.div
          animate={{
            left: ["-10%", "110%", "-10%"],
            opacity: [0.2, 0.6, 0.2]
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 bottom-0 w-2 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent pointer-events-none"
        />
      </div>
    </div>
  )
}

function ExecutionVisibilityChart() {
  return (
    <div className="relative w-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] rounded-xl p-3.5 overflow-hidden flex flex-col gap-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] mt-1">
      <div className="flex items-center justify-between pb-1 border-b border-[color-mix(in_srgb,var(--border)_50%,transparent)]">
        <span className="text-[0.6rem] font-bold tracking-widest text-foreground/60 uppercase">
          Continuous Conversion Analytics
        </span>
        <div className="flex items-center gap-1.5">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
          </span>
          <span className="text-[0.6rem] font-bold text-emerald-400">LIVE</span>
        </div>
      </div>

      <div className="h-28 relative flex items-end overflow-hidden rounded bg-[color-mix(in_srgb,var(--surface)_50%,transparent)]">
        <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="vis-chart-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
            <filter id="vis-glow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#7c6cff" floodOpacity="0.35" />
            </filter>
          </defs>

          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
            d="M 0 90 C 50 75, 100 85, 150 55 C 200 25, 250 65, 300 45 C 350 25, 380 15, 400 10 L 400 100 L 0 100 Z"
            fill="url(#vis-chart-grad)"
          />

          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
            d="M 0 90 C 50 75, 100 85, 150 55 C 200 25, 250 65, 300 45 C 350 25, 380 15, 400 10"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#vis-glow)"
          />
        </svg>

        <motion.div
          animate={{ left: ["0%", "100%", "0%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-[var(--accent)] via-[var(--accent)] to-transparent opacity-60 shadow-[0_0_8px_var(--accent)] pointer-events-none"
        />

        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute"
            style={{ left: "37.5%", top: "55%", transform: "translate(-50%, -50%)" }}
          >
            <div className="relative group/pt pointer-events-auto cursor-pointer">
              <span className="absolute -inset-1.5 rounded-full bg-[var(--accent)] opacity-30 animate-ping" />
              <span className="block size-2 rounded-full bg-white border border-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[color-mix(in_srgb,var(--surface)_95%,transparent)] border border-[var(--border)] text-[0.55rem] font-bold text-foreground px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap opacity-0 transition-opacity group-hover/pt:opacity-100">
                Score: 84%
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute"
            style={{ left: "55%", top: "25%", transform: "translate(-50%, -50%)" }}
          >
            <div className="relative group/pt pointer-events-auto cursor-pointer">
              <span className="absolute -inset-1.5 rounded-full bg-[var(--accent)] opacity-30 animate-ping" />
              <span className="block size-2 rounded-full bg-white border border-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[color-mix(in_srgb,var(--surface)_95%,transparent)] border border-[var(--border)] text-[0.55rem] font-bold text-emerald-400 px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap opacity-0 transition-opacity group-hover/pt:opacity-100">
                Lift: +28.4%
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3.5, delay: 1, repeat: Infinity, ease: "easeInOut" }}
            className="absolute"
            style={{ left: "75%", top: "45%", transform: "translate(-50%, -50%)" }}
          >
            <div className="relative group/pt pointer-events-auto cursor-pointer">
              <span className="absolute -inset-1.5 rounded-full bg-[var(--accent)] opacity-30 animate-ping" />
              <span className="block size-2 rounded-full bg-white border border-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[color-mix(in_srgb,var(--surface)_95%,transparent)] border border-[var(--border)] text-[0.55rem] font-bold text-foreground px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap opacity-0 transition-opacity group-hover/pt:opacity-100">
                Conversions: Active
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[0.52rem] text-foreground/45 font-bold">
        <span>Active monitoring</span>
        <span>Confidence: 99.4%</span>
      </div>
    </div>
  )
}

const features = [
  {
    title: "Conversion Signals",
    description:
      "Surface the clearest friction points and intent gaps across your most valuable journeys.",
    // Column span for the GRID ITEM (applied to FadeIn, the direct grid child)
    gridClassName: "sm:col-span-2 lg:col-span-2",
    // Visual/background styling for the CARD itself (not a grid item)
    className:
      "relative overflow-hidden bg-[color-mix(in_srgb,var(--surface)_86%,transparent)]",
    visual: "hero",
  },
  {
    title: "Priority Queue",
    description:
      "Rank opportunities by likely impact so teams know exactly what to ship first.",
    gridClassName: "",
    className:
      "relative overflow-hidden bg-[color-mix(in_srgb,var(--surface)_72%,transparent)]",
    visual: "queue",
  },
  {
    title: "Actionable Guidance",
    description:
      "Turn findings into concise recommendations with clear ownership and implementation direction.",
    gridClassName: "sm:col-span-1 lg:col-span-1",
    className:
      "relative overflow-hidden bg-[color-mix(in_srgb,var(--surface)_66%,transparent)]",
    visual: "guidance",
  },
  {
    title: "Execution Visibility",
    description:
      "Keep product and growth aligned with a shared view of progress, status, and expected lift.",
    gridClassName: "sm:col-span-2 lg:col-span-2",
    className:
      "relative overflow-hidden bg-[color-mix(in_srgb,var(--surface)_68%,transparent)]",
    visual: "progress",
  },
]

function FeaturesSection() {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null)

  const iconsMap = {
    hero: (
      <svg className="size-4 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
    queue: (
      <svg className="size-4 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 16h8" />
        <path d="M7 11h12" />
        <path d="M7 6h5" />
      </svg>
    ),
    guidance: (
      <svg className="size-4 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
      </svg>
    ),
    progress: (
      <svg className="size-4 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  }

  const queueItems = [
    { name: "Homepage friction", priority: "P1", badgeClass: "text-red-400 border-red-500/30 bg-red-500/5 hover:border-red-400/50" },
    { name: "Pricing clarify", priority: "P2", badgeClass: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-400/50" },
    { name: "Form completion", priority: "P3", badgeClass: "text-foreground/50 border-foreground/15 bg-foreground/5 hover:border-foreground/25" }
  ]
  return (
    <Section aria-labelledby="features-title" containerClassName="marketing-container">
      <div className="marketing-section-stack">
        <FadeIn>
          <SectionHeader
            centered
            eyebrow="Product"
            title="Features built for focused growth execution"
            titleId="features-title"
            description="A clean system of analysis and prioritization designed to help teams ship higher-converting experiences."
          />
        </FadeIn>

        <div className="marketing-features-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const isHovered = hoveredFeature === feature.title

            return (
              <FadeIn
                key={feature.title}
                delay={0.05 + index * 0.05}
                className={cn(
                  "h-auto min-h-0 max-lg:self-start lg:h-full",
                  feature.gridClassName
                )}
              >
                <div
                  onMouseEnter={() => setHoveredFeature(feature.title)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className="h-full"
                >
                  <Card
                    className={cn(
                      "marketing-feature-card h-auto min-h-0 border-[color-mix(in_srgb,var(--border)_90%,transparent)] lg:h-full transition-all duration-300",
                      isHovered
                        ? "shadow-[0_0_24px_rgba(124,108,255,0.18)] border-[color-mix(in_srgb,var(--accent)_35%,var(--border))]"
                        : "hover:translate-y-0",
                      feature.className
                    )}
                  >
                    {feature.visual === "hero" ? (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_55%)]"
                      />
                    ) : null}

                    <div className="marketing-feature-card__body relative flex flex-col justify-between h-full gap-5">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] shadow-[0_0_8px_color-mix(in_srgb,var(--accent)_15%,transparent)]">
                            {iconsMap[feature.visual as keyof typeof iconsMap]}
                          </div>
                          <Heading
                            level={3}
                            size={feature.visual === "hero" ? "section" : "subsection"}
                          >
                            {feature.title}
                          </Heading>
                        </div>
                        <Text variant="muted" size="sm" className="max-w-none leading-6">
                          {feature.description}
                        </Text>
                      </div>

                      {feature.visual === "hero" ? (
                        <div className="space-y-3 lg:mt-auto">
                          <div className="grid grid-cols-3 gap-2">
                            <motion.div
                              animate={{ y: isHovered ? -4 : 0 }}
                              transition={{ duration: 0.25, ease: "easeOut" }}
                              className="marketing-tile border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] p-2.5"
                            >
                              <Text size="sm" variant="muted" className="max-w-none text-[0.62rem] leading-none uppercase text-foreground/45">
                                Intent Match
                              </Text>
                              <Heading level={4} size="subsection" className="mt-1.5 text-sm sm:text-base font-extrabold text-emerald-400">
                                +28%
                              </Heading>
                            </motion.div>
                            <motion.div
                              animate={{ y: isHovered ? -4 : 0 }}
                              transition={{ duration: 0.25, delay: 0.04, ease: "easeOut" }}
                              className="marketing-tile border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] p-2.5"
                            >
                              <Text size="sm" variant="muted" className="max-w-none text-[0.62rem] leading-none uppercase text-foreground/45">
                                Friction Reduced
                              </Text>
                              <Heading level={4} size="subsection" className="mt-1.5 text-sm sm:text-base font-extrabold text-emerald-400">
                                -19%
                              </Heading>
                            </motion.div>
                            <motion.div
                              animate={{ y: isHovered ? -4 : 0 }}
                              transition={{ duration: 0.25, delay: 0.08, ease: "easeOut" }}
                              className="marketing-tile border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] p-2.5"
                            >
                              <Text size="sm" variant="muted" className="max-w-none text-[0.62rem] leading-none uppercase text-foreground/45">
                                Confidence
                              </Text>
                              <Heading level={4} size="subsection" className="mt-1.5 text-sm sm:text-base font-extrabold text-[var(--accent)]">
                                87%
                              </Heading>
                            </motion.div>
                          </div>
                          {/* Ambient sparkline line chart */}
                          <div className="marketing-tile border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] p-0 overflow-hidden h-28 relative flex items-end">
                            <svg className="w-full h-24" viewBox="0 0 400 120" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
                                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>
                              <motion.path
                                initial={{ pathLength: 0 }}
                                whileInView={{ pathLength: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                d="M 0 100 Q 80 50 120 70 T 240 40 T 320 80 T 400 30 L 400 120 L 0 120 Z"
                                fill="url(#chart-grad)"
                              />
                              <motion.path
                                initial={{ pathLength: 0 }}
                                whileInView={{ pathLength: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                d="M 0 100 Q 80 50 120 70 T 240 40 T 320 80 T 400 30"
                                fill="none"
                                stroke="var(--accent)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        </div>
                      ) : null}

                      {feature.visual === "queue" ? (
                        <div className="space-y-2 lg:mt-auto">
                          {queueItems.map((item, itemIndex) => (
                            <motion.div
                              key={item.name}
                              animate={{ x: isHovered ? 5 : 0 }}
                              transition={{ duration: 0.25, delay: itemIndex * 0.05, ease: "easeOut" }}
                              className={cn(
                                "flex items-center justify-between gap-3 marketing-tile border px-4 py-2.5 rounded-full transition-all duration-300",
                                item.badgeClass
                              )}
                            >
                              <Text size="sm" className="max-w-none font-medium leading-none">
                                {item.name}
                              </Text>
                              <span className="text-[0.66rem] font-bold tracking-wider leading-none">
                                {item.priority}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      ) : null}

                      {feature.visual === "guidance" ? (
                        <div className="flex flex-col gap-3 lg:mt-auto">
                          <ABTestVisual />
                          <div className="marketing-tile border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] p-4 flex flex-col gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                            <span className="text-[0.55rem] font-bold tracking-widest text-[var(--accent)] uppercase leading-none">
                              AI ANALYSIS FRAGMENT
                            </span>
                            <Text size="sm" className="italic text-foreground/80 leading-relaxed max-w-none pt-1">
                              "Shorten the hero copy above the fold and elevate the primary CTA — expected lift +12.4%."
                            </Text>
                          </div>
                        </div>
                      ) : null}

                      {feature.visual === "progress" ? (
                        <div className="flex flex-col gap-3 lg:mt-auto">
                          <div className="grid grid-cols-3 gap-2">
                            {/* Rollout Progress */}
                            <div className="marketing-tile border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] p-3 flex flex-col gap-2 justify-between">
                              <span className="text-[0.55rem] font-semibold tracking-wider text-foreground/45 uppercase leading-none">
                                ROLLOUT PROGRESS
                              </span>
                              <span className="text-lg font-extrabold text-foreground leading-none">64%</span>
                              <div className="h-1 rounded-full bg-[color-mix(in_srgb,var(--surface)_70%,black)] overflow-hidden w-full">
                                <div className="h-full w-[64%] bg-[var(--accent)]" />
                              </div>
                            </div>
                            {/* Shipping */}
                            <div className="marketing-tile border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] p-3 flex flex-col gap-1 justify-center text-center">
                              <span className="text-[0.55rem] font-semibold tracking-wider text-foreground/45 uppercase leading-none">
                                SHIPPING
                              </span>
                              <span className="text-lg font-extrabold text-foreground my-0.5 leading-none">12</span>
                              <span className="text-[0.55rem] text-foreground/45 leading-none">this sprint</span>
                            </div>
                            {/* In Review */}
                            <div className="marketing-tile border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] p-3 flex flex-col gap-1 justify-center text-center">
                              <span className="text-[0.55rem] font-semibold tracking-wider text-foreground/45 uppercase leading-none">
                                IN REVIEW
                              </span>
                              <span className="text-lg font-extrabold text-foreground my-0.5 leading-none">4</span>
                              <span className="text-[0.55rem] text-foreground/45 leading-none">awaiting sign-off</span>
                            </div>
                          </div>
                          <ExecutionVisibilityChart />
                        </div>
                      ) : null}
                    </div>
                  </Card>
                </div>
              </FadeIn>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

export { FeaturesSection }