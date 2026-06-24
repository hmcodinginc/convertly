import type { ReactNode } from "react"

import { TextField } from "@/components/forms/TextField"
import { Text } from "@/components/ui/typography/Text"
import { cn } from "@/lib/utils"

type ProfileDetailsRowProps = {
  label: string
  children: ReactNode
  className?: string
}

function ProfileDetailsRow({ label, children, className }: ProfileDetailsRowProps) {
  return (
    <div className={cn("profile-settings-row", className)}>
      <dt className="profile-settings-label">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

type ProfileDetailsGridProps = {
  children: ReactNode
  className?: string
}

function ProfileDetailsGrid({ children, className }: ProfileDetailsGridProps) {
  return (
    <dl className={cn("profile-settings-grid border-t border-[color-mix(in_srgb,var(--border)_50%,transparent)] pt-1", className)}>
      {children}
    </dl>
  )
}

type ProfileDetailsValueProps = {
  value: string
}

function ProfileDetailsValue({ value }: ProfileDetailsValueProps) {
  return (
    <Text variant="muted" size="sm" className="profile-settings-value max-w-none">
      {value || "—"}
    </Text>
  )
}

type ProfileDetailsEditFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  autoComplete?: string
}

function ProfileDetailsEditField({
  label,
  value,
  onChange,
  error,
  disabled,
  autoComplete,
}: ProfileDetailsEditFieldProps) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={error}
      disabled={disabled}
      autoComplete={autoComplete}
      containerClassName="[&_.auth-field-label]:sr-only"
    />
  )
}

export { ProfileDetailsEditField, ProfileDetailsGrid, ProfileDetailsRow, ProfileDetailsValue }
