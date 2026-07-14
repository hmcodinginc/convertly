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
      className="relative flex min-h-0 items-center overflow-hidden pb-6 pt-4 sm:min-h-[min(72vh,46rem)] sm:pb-12 sm:pt-0"
      containerClassName="marketing-container"
    >
      <div className="relative w-full">
        <div className="pointer-events-none absolute inset-x-0 top-[-14rem] -z-10 h-[20rem] bg-[var(--gradient-primary)] opacity-12 blur-3xl" />

        <div className="marketing-hero-grid grid items-center gap-6 py-8 sm:gap-10 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-20">
          <div className="marketing-hero-copy flex max-w-xl flex-col gap-5 sm:max-w-2xl sm:gap-6 lg:max-w-none lg:gap-7">
            <FadeIn>
              <Text
                size="sm"
                className="inline-flex w-fit max-w-none items-center rounded-full border border-[color-mix(in_srgb,var(--accent)_26%,var(--border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_90%,transparent),color-mix(in_srgb,var(--surface)_80%,transparent))] px-3.5 py-1.5 text-[0.7rem] font-medium tracking-[0.16em] uppercase text-foreground/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_color-mix(in_srgb,var(--accent)_12%,transparent)]"
              >
                <span className="mr-2 inline-block size-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
                AI GROWTH INTELLIGENCE
              </Text>
            </FadeIn>

            <FadeIn delay={0.06}>
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

            <FadeIn delay={0.12}>
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

            <FadeIn delay={0.18}>
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

            <FadeIn delay={0.24}>
              <div className="marketing-hero-trust flex flex-wrap items-center gap-x-6 gap-y-2.5 pt-2">
                {[
                  "No credit card",
                  "Ships insights in minutes",
                  "SOC 2 aligned"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-foreground/60">
                    <svg className="size-3.5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.08} className="marketing-hero-visual w-full lg:pl-4">
            <div className="relative mx-auto w-full max-w-xl">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 -top-4 z-0 hidden h-full rounded-[calc(var(--radius-xl)+2px)] border border-[color-mix(in_srgb,var(--border)_72%,transparent)] bg-[color-mix(in_srgb,var(--surface)_58%,transparent)] sm:block"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-4 bottom-5 z-0 hidden h-24 w-24 rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--border)_64%,transparent)] bg-[color-mix(in_srgb,var(--surface)_50%,transparent)] lg:block"
              />

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative z-10"
              >
                <Card className="overflow-hidden marketing-card-compact hover:translate-y-0 p-5 sm:p-6 flex flex-col gap-4 sm:gap-5 border-[color-mix(in_srgb,var(--border)_85%,transparent)]">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,color-mix(in_srgb,var(--accent)_12%,transparent),transparent_58%)]"
                  />
                  
                  {/* Mockup Header */}
                  <div className="relative flex items-center justify-between border-b border-[color-mix(in_srgb,var(--border)_50%,transparent)] pb-4 z-10">
                    <div className="space-y-0.5">
                      <Text size="sm" variant="muted" className="max-w-none text-[0.66rem] font-bold tracking-widest uppercase text-foreground/45">
                        LIVE ANALYSIS
                      </Text>
                      <h4 className="text-sm font-semibold text-foreground">Storefront Conversion</h4>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[0.66rem] font-medium text-emerald-400">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      ACTIVE
                    </span>
                  </div>

                  <div className="relative flex flex-col gap-4 sm:gap-5 z-10">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Opportunity Lift */}
                      <div className="marketing-tile border border-[color-mix(in_srgb,var(--border)_95%,transparent)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] shadow-[0_1px_0_rgba(255,255,255,0.04)]">
                        <Text
                          size="sm"
                          variant="muted"
                          className="max-w-none text-[0.72rem] tracking-[0.08em] uppercase text-foreground/54"
                        >
                          Opportunity Lift
                        </Text>
                        <Heading
                          level={3}
                          size="subsection"
                          className="mt-2 text-[1.75rem] leading-none text-emerald-400 font-extrabold"
                        >
                          <CountUp value={31.4} prefix="+" suffix="%" />
                        </Heading>
                        <div className="h-1 rounded-full bg-[color-mix(in_srgb,var(--surface)_76%,black)] overflow-hidden mt-3">
                          <motion.div
                            initial={{ width: "0%" }}
                            whileInView={{ width: "55%" }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-[var(--accent)]"
                          />
                        </div>
                      </div>

                      {/* Confidence Score */}
                      <div className="marketing-tile border border-[color-mix(in_srgb,var(--border)_95%,transparent)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] shadow-[0_1px_0_rgba(255,255,255,0.04)]">
                        <Text
                          size="sm"
                          variant="muted"
                          className="max-w-none text-[0.72rem] tracking-[0.08em] uppercase text-foreground/54"
                        >
                          Confidence Score
                        </Text>
                        <Heading
                          level={3}
                          size="subsection"
                          className="mt-2 text-[1.75rem] leading-none text-foreground font-extrabold"
                        >
                          <CountUp value={89} />
                        </Heading>
                        {/* 5 segment indicators */}
                        <div className="mt-3 flex gap-1">
                          {[1, 2, 3, 4, 5].map((seg) => (
                            <div
                              key={seg}
                              className={cn(
                                "h-1 flex-1 rounded-full",
                                seg <= 4
                                  ? "bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]"
                                  : "bg-[color-mix(in_srgb,var(--surface)_70%,black)]"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Workflow Coverage */}
                    <div className="marketing-tile border border-[color-mix(in_srgb,var(--border)_96%,transparent)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                      <div className="mb-2.5 flex items-center justify-between gap-3">
                        <Text
                          size="sm"
                          variant="muted"
                          className="max-w-none text-[0.72rem] tracking-[0.08em] uppercase text-foreground/54"
                        >
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
                          viewport={{ once: true, amount: 0.5 }}
                          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full rounded-full bg-[linear-gradient(90deg,color-mix(in_srgb,var(--accent)_92%,white),var(--accent))] shadow-[0_0_14px_color-mix(in_srgb,var(--accent)_30%,transparent)]"
                        />
                      </div>
                    </div>

                    {/* AI Recommendation */}
                    <div className="marketing-tile border border-[color-mix(in_srgb,var(--border)_92%,transparent)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)]">
                      <div className="flex items-center justify-between border-b border-[color-mix(in_srgb,var(--border)_50%,transparent)] pb-2 mb-3">
                        <div className="flex items-center gap-1.5 text-foreground/80">
                          <svg className="size-3.5 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
                          </svg>
                          <Text size="sm" className="max-w-none text-[0.72rem] font-bold tracking-wider uppercase text-foreground/75">
                            AI Recommendation
                          </Text>
                        </div>
                        <span className="text-[0.66rem] font-bold tracking-wider text-[var(--accent)] uppercase">
                          NEXT
                        </span>
                      </div>
                      <div className="space-y-2">
                        <motion.div
                          initial={{ width: "0%" }}
                          whileInView={{ width: "92%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                          className="h-1.5 rounded-full bg-[color-mix(in_srgb,var(--muted)_24%,transparent)]"
                        />
                        <motion.div
                          initial={{ width: "0%" }}
                          whileInView={{ width: "76%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                          className="h-1.5 rounded-full bg-[color-mix(in_srgb,var(--muted)_18%,transparent)]"
                        />
                        <motion.div
                          initial={{ width: "0%" }}
                          whileInView={{ width: "84%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                          className="h-1.5 rounded-full bg-[color-mix(in_srgb,var(--muted)_14%,transparent)]"
                        />
                      </div>
                    </div>

                    {/* Mockup Footer */}
                    <div className="flex items-center justify-between border-t border-[color-mix(in_srgb,var(--border)_50%,transparent)] pt-3 text-[0.68rem] text-foreground/45 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <svg className="size-3.5 text-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                        <span>1,402 signals / min</span>
                      </div>
                      <span>Updated just now</span>
                    </div>
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
