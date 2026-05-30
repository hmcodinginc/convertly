import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_90%,transparent)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] px-3 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-[var(--motion-fast)] placeholder:text-foreground/40 focus:border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)] disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-[color-mix(in_srgb,#f87171_50%,var(--border))] aria-invalid:focus:shadow-[0_0_0_3px_color-mix(in_srgb,#f87171_18%,transparent)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
