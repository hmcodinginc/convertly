import * as React from "react"

import { cn } from "@/lib/utils"

type SectionProps = React.ComponentProps<"section"> & {
  containerized?: boolean
  containerClassName?: string
}

function Section({
  className,
  children,
  containerized = true,
  containerClassName,
  ...props
}: SectionProps) {
  return (
    <section
      data-slot="section"
      className={cn("section-padding", className)}
      {...props}
    >
      {containerized ? (
        <div className={cn("container-premium", containerClassName)}>
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  )
}

export { Section }
