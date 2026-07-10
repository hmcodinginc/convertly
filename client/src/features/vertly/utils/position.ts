import type { VertlyPosition } from "@/features/vertly/types"

const LAUNCHER_WIDTH = 56
const LAUNCHER_HEIGHT = 72
const LAUNCHER_SIZE = LAUNCHER_HEIGHT
const EDGE_INSET = 12
const EDGE_SNAP_THRESHOLD = 32

export function getDefaultPosition(viewportWidth: number, viewportHeight: number): VertlyPosition {
  return {
    x: Math.max(EDGE_INSET, viewportWidth - LAUNCHER_WIDTH - 24),
    y: Math.max(EDGE_INSET, viewportHeight - LAUNCHER_HEIGHT - 24),
  }
}

export function clampVertlyPosition(
  position: VertlyPosition,
  viewportWidth: number,
  viewportHeight: number,
  elementWidth = LAUNCHER_WIDTH,
  elementHeight = LAUNCHER_HEIGHT
): VertlyPosition {
  const maxX = Math.max(EDGE_INSET, viewportWidth - elementWidth - EDGE_INSET)
  const maxY = Math.max(EDGE_INSET, viewportHeight - elementHeight - EDGE_INSET)

  return {
    x: Math.min(Math.max(EDGE_INSET, position.x), maxX),
    y: Math.min(Math.max(EDGE_INSET, position.y), maxY),
  }
}

export function snapFromEdges(
  position: VertlyPosition,
  viewportWidth: number,
  elementWidth = LAUNCHER_WIDTH
): VertlyPosition {
  const snapLeft = EDGE_INSET
  const snapRight = Math.max(EDGE_INSET, viewportWidth - elementWidth - EDGE_INSET)

  let { x, y } = position

  if (x - snapLeft <= EDGE_SNAP_THRESHOLD) {
    x = snapLeft
  } else if (snapRight - x <= EDGE_SNAP_THRESHOLD) {
    x = snapRight
  }

  return { x, y }
}

export { LAUNCHER_SIZE, LAUNCHER_WIDTH, LAUNCHER_HEIGHT, EDGE_INSET, EDGE_SNAP_THRESHOLD }
