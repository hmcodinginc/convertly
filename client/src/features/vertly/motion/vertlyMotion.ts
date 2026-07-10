export const VERTLY_EASE = [0.22, 1, 0.36, 1] as const

export const VERTLY_LAUNCHER_HOVER = {
  y: -4,
  scale: 1.035,
  transition: { duration: 0.26, ease: VERTLY_EASE },
} as const

export const VERTLY_LAUNCHER_TAP = {
  scale: 0.94,
  transition: { duration: 0.16, ease: VERTLY_EASE },
} as const

export const VERTLY_PANEL_TRANSITION = {
  duration: 0.42,
  ease: VERTLY_EASE,
} as const

export const VERTLY_BACKDROP_TRANSITION = {
  duration: 0.34,
  ease: VERTLY_EASE,
} as const
