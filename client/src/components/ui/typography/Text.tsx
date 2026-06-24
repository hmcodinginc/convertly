import * as React from "react"

import { cn } from "@/lib/utils"

type TextVariant = "default" | "muted"
type TextSize = "sm" | "base" | "lg"

type TextProps = React.ComponentProps<"p"> & {
  variant?: TextVariant
  size?: TextSize
  balanced?: boolean
}

const variantClasses: Record<TextVariant, string> = {
  default: "text-foreground/90",
  muted: "text-muted",
}

const sizeClasses: Record<TextSize, string> = {
  sm: "text-sm leading-6",
  base: "text-base leading-7",
  lg: "text-lg leading-8",
}

function Text({
  className,
  variant = "default",
  size = "base",
  balanced = false,
  ...props
}: TextProps) {
  return (
    <p
      data-slot="text"
      data-variant={variant}
      data-size={size}
      className={cn(
        "max-w-prose",
        variantClasses[variant],
        sizeClasses[size],
        balanced && "text-balance",
        className
      )}
      {...props}
    />
  )
}

export { Text }