/** Production geometry — V4 Triad Focus · R-A Balanced Pro */

const CONVERTLY_MARK_VIEWBOX = "0 0 48 48" as const

const CONVERTLY_MARK_BRACKETS = [
  {
    id: "bracket-left",
    d: "M9 11 C9 17, 13 21, 18.63 20.9",
    strokeWidth: 2.85,
  },
  {
    id: "bracket-right",
    d: "M39 11 C39 17, 35 21, 28.37 20.9",
    strokeWidth: 2.85,
  },
  {
    id: "bracket-bottom",
    d: "M24 41 C24 36, 24 33, 24 30.2",
    strokeWidth: 3,
  },
] as const

const CONVERTLY_MARK_RING = {
  cx: 24,
  cy: 24,
  r: 6.6,
  strokeWidth: 1.35,
  opacity: 0.38,
} as const

const CONVERTLY_MARK_DOT = {
  cx: 24,
  cy: 24,
  r: 2.35,
} as const

export {
  CONVERTLY_MARK_BRACKETS,
  CONVERTLY_MARK_DOT,
  CONVERTLY_MARK_RING,
  CONVERTLY_MARK_VIEWBOX,
}
