import { motion, useReducedMotion } from "framer-motion"

import { Text } from "@/components/ui/typography/Text"
import { AUTH_SHOWCASE_SLIDES } from "@/features/auth/content/authContent"

type AuthShowcaseProgressProps = {
  activeIndex: number
  paused: boolean
  intervalMs: number
}

function AuthShowcaseProgress({
  activeIndex,
  paused,
  intervalMs,
}: AuthShowcaseProgressProps) {
  const shouldReduceMotion = useReducedMotion()
  const total = AUTH_SHOWCASE_SLIDES.length
  const activeSlide = AUTH_SHOWCASE_SLIDES[activeIndex]

  return (
    <div className="auth-showcase-progress">
      <div className="mb-3 flex items-center gap-2">
        {AUTH_SHOWCASE_SLIDES.map((slide, index) => {
          const isActive = index === activeIndex
          const isComplete = index < activeIndex

          return (
            <div
              key={slide.id}
              aria-hidden="true"
              className="relative h-1 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--muted)_18%,transparent)]"
            >
              {isComplete ? (
                <div className="h-full w-full rounded-full bg-[var(--accent)]" />
              ) : null}

              {isActive ? (
                paused || shouldReduceMotion ? (
                  <div className="h-full w-full rounded-full bg-[color-mix(in_srgb,var(--accent)_55%,transparent)]" />
                ) : (
                  <motion.div
                    key={`progress-${activeIndex}`}
                    className="h-full rounded-full bg-[var(--accent)]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: intervalMs / 1000, ease: "linear" }}
                  />
                )
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Text size="sm" variant="muted" className="max-w-none text-xs tracking-wide uppercase">
          {activeSlide.eyebrow}
        </Text>
        <Text size="sm" variant="muted" className="max-w-none text-xs tabular-nums">
          {activeIndex + 1} / {total}
        </Text>
      </div>
    </div>
  )
}

export { AuthShowcaseProgress }
