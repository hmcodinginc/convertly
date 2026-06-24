import { motion, useReducedMotion } from "framer-motion"

import { AUTH_SLIDE_INTERVAL_MS } from "@/features/auth/content/authContent"
import { cn } from "@/lib/utils"

type AuthSlideProgressProps = {
  count: number
  activeIndex: number
  onSelect: (index: number) => void
}

function AuthSlideProgress({ count, activeIndex, onSelect }: AuthSlideProgressProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div
      className="mt-5 flex shrink-0 items-center gap-2"
      role="tablist"
      aria-label="Product showcase slides"
    >
      {Array.from({ length: count }).map((_, index) => {
        const isActive = index === activeIndex
        const isComplete = index < activeIndex

        return (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Slide ${index + 1} of ${count}`}
            onClick={() => onSelect(index)}
            className={cn(
              "relative h-1 flex-1 overflow-hidden rounded-full transition-colors",
              isActive || isComplete
                ? "bg-[color-mix(in_srgb,var(--accent)_22%,transparent)]"
                : "bg-[color-mix(in_srgb,var(--muted)_18%,transparent)]"
            )}
          >
            {isComplete ? (
              <span className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-70" />
            ) : null}
            {isActive ? (
              <motion.span
                key={`progress-${activeIndex}`}
                className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)]"
                initial={{ width: shouldReduceMotion ? "100%" : "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: shouldReduceMotion ? 0 : AUTH_SLIDE_INTERVAL_MS / 1000,
                  ease: "linear",
                }}
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export { AuthSlideProgress }
