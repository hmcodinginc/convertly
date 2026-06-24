import * as React from "react"

import { cn } from "@/lib/utils"

function GlassPanel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="glass-panel"
      className={cn(
        "glass-surface relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_42%)] before:opacity-70",
        className
      )}
      {...props}
    />
  )
}

export { GlassPanel }
