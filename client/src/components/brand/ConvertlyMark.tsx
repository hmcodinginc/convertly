import * as React from "react"

import {
  CONVERTLY_MARK_BRACKETS,
  CONVERTLY_MARK_DOT,
  CONVERTLY_MARK_RING,
  CONVERTLY_MARK_VIEWBOX,
} from "@/components/brand/convertlyMarkPaths"
import { cn } from "@/lib/utils"

type ConvertlyMarkProps = React.SVGAttributes<SVGSVGElement> & {
  size?: number
}

function ConvertlyMark({
  size = 24,
  className,
  ...props
}: ConvertlyMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={CONVERTLY_MARK_VIEWBOX}
      width={size}
      height={size}
      fill="none"
      aria-hidden
      className={cn("shrink-0 text-foreground", className)}
      {...props}
    >
      {CONVERTLY_MARK_BRACKETS.map((bracket) => (
        <path
          key={bracket.id}
          d={bracket.d}
          stroke="currentColor"
          strokeWidth={bracket.strokeWidth}
          strokeLinecap="round"
        />
      ))}
      <circle
        cx={CONVERTLY_MARK_RING.cx}
        cy={CONVERTLY_MARK_RING.cy}
        r={CONVERTLY_MARK_RING.r}
        stroke="currentColor"
        strokeWidth={CONVERTLY_MARK_RING.strokeWidth}
        opacity={CONVERTLY_MARK_RING.opacity}
      />
      <circle
        cx={CONVERTLY_MARK_DOT.cx}
        cy={CONVERTLY_MARK_DOT.cy}
        r={CONVERTLY_MARK_DOT.r}
        fill="currentColor"
      />
    </svg>
  )
}

export { ConvertlyMark }
