import { Eye, EyeOff } from "lucide-react"
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
  type,
  containerClassName,
  className,
  disabled,
  ...props
}: TextFieldProps) {
  const generatedId = React.useId()
  const fieldId = id ?? generatedId
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined
  const isPasswordField = type === "password"
  const [showPassword, setShowPassword] = React.useState(false)
  const resolvedType = isPasswordField && showPassword ? "text" : type

  React.useEffect(() => {
    if (!isPasswordField) {
      setShowPassword(false)
    }
  }, [isPasswordField])

  return (
    <div className={cn("auth-field", containerClassName)}>
      <Label htmlFor={fieldId} className="auth-field-label">
        {label}
      </Label>
      <div className={cn(isPasswordField && "auth-field-input-wrap")}>
        <Input
          id={fieldId}
          type={resolvedType}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          disabled={disabled}
          className={cn(isPasswordField && "auth-field-input--password", className)}
          {...props}
        />
        {isPasswordField ? (
          <button
            type="button"
            className="auth-field-password-toggle"
            onClick={() => setShowPassword((current) => !current)}
            disabled={disabled}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        ) : null}
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

export { TextField }
