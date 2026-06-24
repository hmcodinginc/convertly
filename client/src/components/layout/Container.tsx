import * as React from "react"

import { cn } from "@/lib/utils"

type ContainerSize = "default" | "wide" | "narrow"

type ContainerProps = React.ComponentProps<"div"> & {
  size?: ContainerSize
}

const sizeClasses: Record<ContainerSize, string> = {
  default: "",
  wide: "[--container-max:90rem]",
  narrow: "[--container-max:64rem]",
}

function Container({
  className,
  size = "default",
  ...props
}: ContainerProps) {
  return (
    <div
      data-slot="container"
      data-size={size}
      className={cn("container-premium", sizeClasses[size], className)}
      {...props}
    />
  )
}

export { Container }
