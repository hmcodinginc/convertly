import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--border)_95%,rgba(255,255,255,0.06))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_88%,rgba(255,255,255,0.04))_0%,color-mix(in_srgb,var(--surface)_84%,transparent)_100%)] p-6 shadow-[0_1px_0_rgba(255,255,255,0.04),0_10px_30px_rgba(2,6,23,0.32)] transition-[transform,border-color,box-shadow,background-color] duration-[var(--motion-base)] ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--accent)_24%,var(--border))] hover:shadow-[0_1px_0_rgba(255,255,255,0.05),0_14px_38px_rgba(2,6,23,0.38)]",
        className
      )}
      {...props}
    />
  )
}

export { Card }