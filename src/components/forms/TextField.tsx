import * as React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Text } from "@/components/ui/typography/Text"
import { cn } from "@/lib/utils"

type TextFieldProps = React.ComponentProps<"input"> & {
  label: string
  error?: string | null
  hint?: string
  containerClassName?: string
}

function TextField({
  label,
  error,
  hint,
  id,
  containerClassName,
  className,
  ...props
}: TextFieldProps) {
  const fieldId = id ?? React.useId()
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined

  return (
    <div className={cn("auth-field", containerClassName)}>
      <Label htmlFor={fieldId} className="auth-field-label">
        {label}
      </Label>
      <Input
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={className}
        {...props}
      />
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

export { TextField }
