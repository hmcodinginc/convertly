import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"

import { AuthLegalPanel } from "@/components/auth/AuthLegalPanel"
import { useAuthPanel } from "@/components/auth/AuthPanelContext"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { AuthShowcaseProgress } from "@/features/auth/components/AuthShowcaseProgress"
import { AuthShowcaseSlideContent } from "@/features/auth/components/AuthShowcaseSlideContent"
import {
  AUTH_SHOWCASE_SLIDES,
  AUTH_SLIDE_INTERVAL_MS,
} from "@/features/auth/content/authContent"

function AuthRotatingPanel() {
  const { activeLegal } = useAuthPanel()
  const [activeIndex, setActiveIndex] = useState(0)
  const shouldReduceMotion = useReducedMotion()
  const slide = AUTH_SHOWCASE_SLIDES[activeIndex]

  useEffect(() => {
    if (activeLegal) return

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % AUTH_SHOWCASE_SLIDES.length)
    }, AUTH_SLIDE_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [activeLegal])

  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col">
      <div className="auth-showcase-stage">
        {activeLegal ? (
          <div className="auth-showcase-legal">
            <AuthLegalPanel view={activeLegal} />
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={slide.id}
              className="auth-showcase-slide px-8 pb-4"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
              transition={{
                duration: shouldReduceMotion ? 0.2 : 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="space-y-2">
                <Text
                  size="sm"
                  className="max-w-none text-xs font-medium tracking-[0.16em] uppercase text-foreground/58"
                >
                  {slide.eyebrow}
                </Text>
                <Heading level={2} size="title" className="max-w-[20ch] text-balance">
                  {slide.title}
                </Heading>
                <Text
                  variant="muted"
                  size="sm"
                  className="max-w-[40ch] leading-6 text-foreground/62"
                >
                  {slide.description}
                </Text>
              </div>

              <div className="auth-showcase-slide-body">
                <AuthShowcaseSlideContent slideId={slide.id} />
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {!activeLegal ? (
        <AuthShowcaseProgress
          activeIndex={activeIndex}
          paused={false}
          intervalMs={AUTH_SLIDE_INTERVAL_MS}
        />
      ) : null}
    </div>
  )
}

export { AuthRotatingPanel }
