import { Text } from "@/components/ui/typography/Text"
import { cn } from "@/lib/utils"

type PreferenceRowProps = {
  label: string
  description?: string
  children: React.ReactNode
  className?: string
}

function PreferenceRow({ label, description, children, className }: PreferenceRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-[color-mix(in_srgb,var(--border)_50%,transparent)] py-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 sm:max-w-[55%]">
        <Text size="sm" className="max-w-none font-medium text-foreground/85">
          {label}
        </Text>
        {description ? (
          <Text variant="muted" size="sm" className="mt-1 max-w-none leading-6">
            {description}
          </Text>
        ) : null}
      </div>
      <div className="shrink-0 sm:text-right">{children}</div>
    </div>
  )
}

export { PreferenceRow }
