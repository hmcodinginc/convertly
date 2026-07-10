import { useMemo } from "react"

import type { VertlyPosition } from "@/features/vertly/types"
import { EDGE_INSET, LAUNCHER_HEIGHT, LAUNCHER_WIDTH } from "@/features/vertly/utils/position"

const PANEL_WIDTH = 384
const PANEL_HEIGHT = 544
const LAUNCHER_GAP = 10

type VertlyPanelAnchor = {
  left: number
  top: number
  transformOrigin: string
}

function useVertlyPanelAnchor(position: VertlyPosition): VertlyPanelAnchor {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return { left: EDGE_INSET, top: EDGE_INSET, transformOrigin: "bottom right" }
    }

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const launcherCenterX = position.x + LAUNCHER_WIDTH / 2
    const launcherBottom = position.y + LAUNCHER_HEIGHT

    let left = launcherCenterX - PANEL_WIDTH + LAUNCHER_WIDTH / 2
    left = Math.max(EDGE_INSET, Math.min(left, viewportWidth - PANEL_WIDTH - EDGE_INSET))

    let top = position.y - PANEL_HEIGHT - LAUNCHER_GAP
    if (top < EDGE_INSET) {
      top = Math.min(
        launcherBottom + LAUNCHER_GAP,
        viewportHeight - PANEL_HEIGHT - EDGE_INSET
      )
    }

    const originX = launcherCenterX - left
    const originY = Math.min(
      Math.max(launcherBottom - top, 24),
      PANEL_HEIGHT - 24
    )

    return {
      left,
      top,
      transformOrigin: `${originX}px ${originY}px`,
    }
  }, [position.x, position.y])
}

export { useVertlyPanelAnchor, PANEL_WIDTH, PANEL_HEIGHT }
