import * as React from "react"

import { cn } from "@/lib/utils"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"

type SectionHeaderProps = React.ComponentProps<"div"> & {
  eyebrow?: string
  title?: string
  description?: string
  centered?: boolean
  variant?: "marketing" | "app"
  titleId?: string
}

function SectionHeader({
  eyebrow,
  title,
  description,
  centered = false,
  variant = "marketing",
  titleId,
  className,
  ...props
}: SectionHeaderProps) {
  if (!eyebrow && !title && !description) return null

  const isApp = variant === "app"

  return (
    <div
      data-slot="section-header"
      data-variant={variant}
      className={cn(
        isApp ? "space-y-2" : "space-y-3",
        centered && "text-center",
        className
      )}
      {...props}
    >
      {(eyebrow || title) && (
        <div className={cn("flex flex-col gap-2")}>
          {eyebrow ? (
            <Text
              variant="muted"
              size="sm"
              className={cn(
                "max-w-none font-medium uppercase",
                "tracking-[0.16em]",
                centered && "mx-auto"
              )}
            >
              {eyebrow}
            </Text>
          ) : null}

          {title ? (
            <Heading
              id={titleId}
              level={2}
              size={isApp ? "section" : "title"}
              className={cn(
            isApp ? "max-w-none" : "max-w-3xl marketing-scroll-target",
            centered && "mx-auto"
          )}
            >
              {title}
            </Heading>
          ) : null}
        </div>
      )}

      {description ? (
        <Text
          variant="muted"
          size={isApp ? "sm" : "lg"}
          balanced={!isApp}
          className={cn(isApp ? "max-w-2xl leading-6" : "max-w-2xl", centered && "mx-auto")}
        >
          {description}
        </Text>
      ) : null}
    </div>
  )
}

export { SectionHeader }
