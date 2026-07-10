import type { VertlyPosition } from "@/features/vertly/types"
import { clampVertlyPosition } from "@/features/vertly/utils/position"

const FRICTION = 0.9
const MIN_VELOCITY = 0.35

export type VertlyVelocity = {
  x: number
  y: number
}

export function runVertlyInertia(
  start: VertlyPosition,
  velocity: VertlyVelocity,
  onUpdate: (position: VertlyPosition) => void,
  onComplete: (position: VertlyPosition) => void
): () => void {
  let position = { ...start }
  let vx = velocity.x
  let vy = velocity.y
  let frameId = 0
  let cancelled = false

  function tick() {
    if (cancelled) return

    if (Math.abs(vx) < MIN_VELOCITY && Math.abs(vy) < MIN_VELOCITY) {
      onComplete(position)
      return
    }

    position = clampVertlyPosition(
      { x: position.x + vx, y: position.y + vy },
      window.innerWidth,
      window.innerHeight
    )

    onUpdate(position)
    vx *= FRICTION
    vy *= FRICTION
    frameId = window.requestAnimationFrame(tick)
  }

  frameId = window.requestAnimationFrame(tick)

  return () => {
    cancelled = true
    window.cancelAnimationFrame(frameId)
  }
}
