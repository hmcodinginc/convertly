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

  if (centered && !isApp) {
    return (
      <div
        data-slot="section-header"
        data-variant={variant}
        data-centered="true"
        className={cn("flex w-full flex-col gap-3", className)}
        {...props}
      >
        {eyebrow ? (
          <Text
            size="sm"
            data-slot="section-header-eyebrow"
            className="w-full max-w-none text-center font-semibold uppercase tracking-[0.16em] text-[var(--accent)]"
          >
            {eyebrow}
          </Text>
        ) : null}

        {title || description ? (
          <div
            data-slot="section-header-copy"
            className="marketing-section-header__copy flex w-full max-w-3xl flex-col items-center gap-3 self-center text-center"
          >
            {title ? (
              <Heading
                id={titleId}
                level={2}
                size="title"
                className="marketing-scroll-target w-full text-center text-balance"
              >
                {title}
              </Heading>
            ) : null}

            {description ? (
              <Text
                variant="muted"
                size="lg"
                balanced
                className="w-full max-w-2xl text-center"
              >
                {description}
              </Text>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div
      data-slot="section-header"
      data-variant={variant}
      className={cn(isApp ? "space-y-2" : "space-y-3", className)}
      {...props}
    >
      {(eyebrow || title) && (
        <div className="flex w-full flex-col gap-2">
          {eyebrow ? (
            <Text
              size="sm"
              className="max-w-none font-semibold uppercase tracking-[0.16em] text-[var(--accent)]"
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
                isApp ? "max-w-none" : "marketing-scroll-target w-full max-w-3xl"
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
          className={isApp ? "max-w-2xl leading-6" : "max-w-2xl"}
        >
          {description}
        </Text>
      ) : null}
    </div>
  )
}

export { SectionHeader }