import * as React from "react"

import { cn } from "@/lib/utils"

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
type HeadingSize = "hero" | "title" | "section" | "subsection"

type HeadingProps = React.ComponentProps<"h1"> & {
  level?: HeadingLevel
  size?: HeadingSize
}

const sizeClasses: Record<HeadingSize, string> = {
  hero: "text-4xl leading-tight font-medium tracking-tight sm:text-5xl lg:text-6xl",
  title: "text-3xl leading-tight font-medium tracking-tight sm:text-4xl",
  section: "text-2xl leading-tight font-semibold tracking-tight sm:text-3xl",
  subsection: "text-xl leading-snug font-semibold tracking-tight sm:text-2xl",
}

function Heading({
  level = 2,
  size = "section",
  className,
  ...props
}: HeadingProps) {
  const Comp = `h${level}` as keyof React.JSX.IntrinsicElements

  return (
    <Comp
      data-slot="heading"
      data-level={level}
      data-size={size}
      className={cn("text-foreground", sizeClasses[size], className)}
      {...props}
    />
  )
}

export { Heading }
