import { useEffect, useRef } from "react"
import { motion, useInView, animate } from "framer-motion"
import { Button } from "@/components/ui/button"
import { MarketingNavLink } from "@/components/layout/MarketingNavLink"
import { useAppAuthNavigate } from "@/hooks/useAppAuthNavigate"
import { ROUTES } from "@/lib/routes"
import { Section } from "@/components/layout/Section"
import { Card } from "@/components/surfaces/Card"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { FadeIn } from "@/components/motion/FadeIn"
import { cn } from "@/lib/utils"

interface CountUpProps {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
}

function CountUp({ value, prefix = "", suffix = "", duration = 1.6 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })

  useEffect(() => {
    if (!inView) return
    const node = ref.current
    if (!node) return

    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(val) {
        node.textContent = prefix + Math.round(val) + suffix
      },
    })

    return () => controls.stop()
  }, [inView, value, prefix, suffix, duration])

  return <span ref={ref}>{prefix}0{suffix}</span>
}

function HeroSection() {
  const { navigateWithSession } = useAppAuthNavigate()

  return (
    <Section
      aria-labelledby="home-hero-title"
      className="marketing-hero-section relative flex min-h-0 items-center overflow-hidden pb-6 pt-4 sm:min-h-[min(72vh,46rem)] sm:pb-12 sm:pt-0"
      containerClassName="marketing-container"
    >
      <div className="relative w-full">
        <div className="pointer-events-none absolute inset-x-0 top-[-14rem] -z-10 h-[20rem] bg-[var(--gradient-primary)] opacity-12 blur-3xl" />

        <div className="marketing-hero-grid grid items-center gap-6 py-8 sm:gap-10 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-20">
          <div className="marketing-hero-copy flex max-w-xl flex-col gap-5 sm:max-w-2xl sm:gap-6 lg:max-w-none lg:gap-7">
            {/* 1. Badge Text */}
            <FadeIn direction="down" distance={20} duration={0.7}>
              <Text
                size="sm"
                className="inline-flex w-fit max-w-none items-center rounded-full border border-[color-mix(in_srgb,var(--accent)_26%,var(--border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_90%,transparent),color-mix(in_srgb,var(--surface)_80%,transparent))] px-3.5 py-1.5 text-[0.7rem] font-medium tracking-[0.16em] uppercase text-foreground/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_color-mix(in_srgb,var(--accent)_12%,transparent)]"
              >
                <span className="mr-2 inline-block size-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
                GROWTH INTELLIGENCE
              </Text>
            </FadeIn>

            {/* 2. Main Heading */}
            <FadeIn delay={0.1} direction="up" distance={30} duration={0.9}>
              <Heading
                id="home-hero-title"
                level={1}
                size="hero"
                className="marketing-scroll-target max-w-[13ch] text-balance leading-[1.02] sm:max-w-[11.5ch]"
              >
                Turn more visitors <br className="hidden sm:inline" />
                into <span className="bg-gradient-to-r from-[var(--accent)] to-[#9e91ff] bg-clip-text text-transparent">revenue.</span>
              </Heading>
            </FadeIn>

            {/* 3. Subtext Description */}
            <FadeIn delay={0.25} direction="up" distance={20} duration={0.9}>
              <Text
                variant="muted"
                size="lg"
                balanced
                className="max-w-[42ch] text-foreground/68"
              >
                Convertly analyzes your website experience and highlights the
                highest-impact opportunities to improve conversion — with clarity
                and speed.
              </Text>
            </FadeIn>

            {/* 4. Action Buttons */}
            <FadeIn delay={0.4} direction="up" distance={15} duration={0.8}>
              <div className="marketing-hero-actions flex w-full flex-col gap-4 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  className="marketing-cta-primary w-full sm:w-auto h-11 flex items-center justify-center gap-1.5"
                  onClick={() => void navigateWithSession(ROUTES.auditNew)}
                >
                  <span>Start free audit</span>
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  className="marketing-cta-secondary w-full border-[var(--border)] sm:w-auto h-11"
                  asChild
                >
                  <MarketingNavLink sectionId="how-it-works-title">
                    See how it works
                  </MarketingNavLink>
                </Button>
              </div>
            </FadeIn>

            {/* 5. Staggered Trust Items */}
            <div className="marketing-hero-trust flex flex-wrap items-center gap-x-6 gap-y-2.5 pt-2">
              {[
                "No credit card",
                "Ships insights in minutes",
                "Public website audits only"
              ].map((item, i) => (
                <FadeIn key={item} delay={0.6 + i * 0.1} direction="up" distance={10} duration={0.6}>
                  <div className="flex items-center gap-2 text-xs text-foreground/60">
                    <svg className="size-3.5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span>{item}</span>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          {/* 6. Visual Card Section */}
          <FadeIn delay={0.2} duration={1} className="marketing-hero-visual w-full lg:pl-4">
            <div className="relative mx-auto w-full max-w-xl">
              {/* Background Glows (Stationary) */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-8 -top-4 z-0 hidden h-full rounded-[calc(var(--radius-xl)+2px)] border border-[color-mix(in_srgb,var(--border)_72%,transparent)] bg-[color-mix(in_srgb,var(--surface)_58%,transparent)] sm:block" />
              
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10"
              >
                <Card className="overflow-hidden marketing-card-compact p-5 sm:p-6 flex flex-col gap-4 sm:gap-5 border-[color-mix(in_srgb,var(--border)_85%,transparent)]">
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,color-mix(in_srgb,var(--accent)_12%,transparent),transparent_58%)]" />
                  
                  {/* Card Header (Staggered) */}
                  <div className="relative flex items-center justify-between border-b border-[color-mix(in_srgb,var(--border)_50%,transparent)] pb-4 z-10">
                    <div className="space-y-0.5">
                      <FadeIn delay={0.8} distance={5}>
                        <Text size="sm" variant="muted" className="max-w-none text-[0.66rem] font-bold tracking-widest uppercase text-foreground/45">
                          LIVE ANALYSIS
                        </Text>
                      </FadeIn>
                      <FadeIn delay={0.9} distance={5}>
                        <h4 className="text-sm font-semibold text-foreground">Storefront Conversion</h4>
                      </FadeIn>
                    </div>
                    <FadeIn delay={1} direction="left" distance={10}>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[0.66rem] font-medium text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ACTIVE
                      </span>
                    </FadeIn>
                  </div>

                  {/* Card Body Grid */}
                  <div className="relative flex flex-col gap-4 sm:gap-5 z-10">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Tile 1 */}
                      <FadeIn delay={1.1} distance={15} className="marketing-tile border border-[color-mix(in_srgb,var(--border)_95%,transparent)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)]">
                        <Text size="sm" variant="muted" className="max-w-none text-[0.72rem] tracking-[0.08em] uppercase text-foreground/54">
                          Opportunity Lift
                        </Text>
                        <Heading level={3} size="subsection" className="mt-2 text-[1.75rem] leading-none text-emerald-400 font-extrabold">
                          <CountUp value={31.4} prefix="+" suffix="%" />
                        </Heading>
                        <div className="h-1 rounded-full bg-[color-mix(in_srgb,var(--surface)_76%,black)] overflow-hidden mt-3">
                          <motion.div
                            initial={{ width: "0%" }}
                            whileInView={{ width: "55%" }}
                            transition={{ duration: 1.5, delay: 1.5 }}
                            className="h-full bg-[var(--accent)]"
                          />
                        </div>
                      </FadeIn>

                      {/* Tile 2 */}
                      <FadeIn delay={1.2} distance={15} className="marketing-tile border border-[color-mix(in_srgb,var(--border)_95%,transparent)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)]">
                        <Text size="sm" variant="muted" className="max-w-none text-[0.72rem] tracking-[0.08em] uppercase text-foreground/54">
                          Confidence Score
                        </Text>
                        <Heading level={3} size="subsection" className="mt-2 text-[1.75rem] leading-none text-foreground font-extrabold">
                          <CountUp value={89} />
                        </Heading>
                        <div className="mt-3 flex gap-1">
                          {[1, 2, 3, 4, 5].map((seg) => (
                            <motion.div
                              key={seg}
                              initial={{ opacity: 0, scale: 0 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 1.6 + seg * 0.1 }}
                              className={cn(
                                "h-1 flex-1 rounded-full",
                                seg <= 4 ? "bg-[var(--accent)]" : "bg-foreground/10"
                              )}
                            />
                          ))}
                        </div>
                      </FadeIn>
                    </div>

                    {/* Workflow Tile */}
                    <FadeIn delay={1.3} distance={15} className="marketing-tile border border-[color-mix(in_srgb,var(--border)_96%,transparent)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)]">
                      <div className="mb-2.5 flex items-center justify-between gap-3">
                        <Text size="sm" variant="muted" className="max-w-none text-[0.72rem] tracking-[0.08em] uppercase text-foreground/54">
                          Workflow Coverage
                        </Text>
                        <Text size="sm" className="max-w-none text-sm font-semibold text-foreground/90">
                          68%
                        </Text>
                      </div>
                      <div className="h-1.5 rounded-full bg-[color-mix(in_srgb,var(--surface)_76%,black)] overflow-hidden">
                        <motion.div
                          initial={{ width: "0%" }}
                          whileInView={{ width: "68%" }}
                          transition={{ duration: 1.8, delay: 1.8 }}
                          className="h-full rounded-full bg-[var(--accent)]"
                        />
                      </div>
                    </FadeIn>

                    {/* AI Recommendation Tile */}
                    <FadeIn delay={1.4} distance={15} className="marketing-tile border border-[color-mix(in_srgb,var(--border)_92%,transparent)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)]">
                      <div className="flex items-center justify-between border-b border-[color-mix(in_srgb,var(--border)_50%,transparent)] pb-2 mb-3">
                        <div className="flex items-center gap-1.5 text-foreground/80">
                          <svg className="size-3.5 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
                          </svg>
                          <Text size="sm" className="max-w-none text-[0.72rem] font-bold tracking-wider uppercase text-foreground/75">
                            Top Recommendation
                          </Text>
                        </div>
                        <span className="text-[0.66rem] font-bold tracking-wider text-[var(--accent)] uppercase">NEXT</span>
                      </div>
                      <div className="space-y-2">
                        {[0.1, 0.25, 0.4].map((d, i) => (
                          <motion.div
                            key={i}
                            initial={{ width: "0%" }}
                            whileInView={{ width: i === 0 ? "92%" : i === 1 ? "76%" : "84%" }}
                            transition={{ duration: 1.2, delay: 2 + d }}
                            className="h-1.5 rounded-full bg-foreground/5"
                          />
                        ))}
                      </div>
                    </FadeIn>

                    {/* Footer Stagger */}
                    <FadeIn delay={1.6} direction="up" distance={10} className="flex items-center justify-between border-t border-[color-mix(in_srgb,var(--border)_50%,transparent)] pt-3 text-[0.68rem] text-foreground/45 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <svg className="size-3.5 text-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                        <span>1,402 signals / min</span>
                      </div>
                      <span>Updated just now</span>
                    </FadeIn>
                  </div>
                </Card>
              </motion.div>
            </div>
          </FadeIn>
        </div>
      </div>
    </Section>
  )
}

export { HeroSection }