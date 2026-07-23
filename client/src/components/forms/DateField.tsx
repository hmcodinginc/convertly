import { Calendar } from "lucide-react"
import * as React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Text } from "@/components/ui/typography/Text"
import { cn } from "@/lib/utils"

type DateFieldProps = Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> & {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string | null
  hint?: string
  containerClassName?: string
}

function DateField({
  label,
  value,
  onChange,
  error,
  hint,
  id,
  containerClassName,
  className,
  disabled,
  ...props
}: DateFieldProps) {
  const generatedId = React.useId()
  const fieldId = id ?? generatedId
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined

  return (
    <div className={cn("auth-field", containerClassName)}>
      <Label htmlFor={fieldId} className="auth-field-label">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={fieldId}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          disabled={disabled}
          className={cn(
            "date-field-input pr-10 [color-scheme:dark]",
            className
          )}
          {...props}
        />
        <Calendar
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
      </div>
      {hint ? (
        <Text id={hintId} variant="muted" size="sm" className="auth-field-hint max-w-none">
          {hint}
        </Text>
      ) : null}
      {error ? (
        <Text id={errorId} size="sm" className="auth-field-error max-w-none">
          {error}
        </Text>
      ) : null}
    </div>
  )
}

export { DateField }
