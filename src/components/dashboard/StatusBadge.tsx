import { cn } from "@/lib/utils"

type StatusBadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "accent"
  | "neutral"

type StatusBadgeProps = {
  label: string
  variant?: StatusBadgeVariant
  className?: string
}

const variantClasses: Record<StatusBadgeVariant, string> = {
  default:
    "border-[color-mix(in_srgb,var(--border)_90%,transparent)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] text-foreground/80",
  success:
    "border-[color-mix(in_srgb,#34d399_35%,var(--border))] bg-[color-mix(in_srgb,#34d399_12%,var(--surface))] text-[#86efac]",
  warning:
    "border-[color-mix(in_srgb,#fbbf24_35%,var(--border))] bg-[color-mix(in_srgb,#fbbf24_10%,var(--surface))] text-[#fde68a]",
  danger:
    "border-[color-mix(in_srgb,#f87171_35%,var(--border))] bg-[color-mix(in_srgb,#f87171_10%,var(--surface))] text-[#fecaca]",
  accent:
    "border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_14%,var(--surface))] text-[color-mix(in_srgb,var(--accent)_70%,white)]",
  neutral:
    "border-[color-mix(in_srgb,var(--border)_95%,transparent)] bg-[color-mix(in_srgb,var(--card)_90%,transparent)] text-muted",
}

function StatusBadge({
  label,
  variant = "default",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
        variantClasses[variant],
        className
      )}
    >
      {label}
    </span>
  )
}

export { StatusBadge }
export type { StatusBadgeVariant }
