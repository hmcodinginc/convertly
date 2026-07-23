import { Loader2 } from "lucide-react"
import { useEffect, useMemo, useState, type FormEvent } from "react"

import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { Combobox } from "@/components/forms/Combobox"
import { DateField } from "@/components/forms/DateField"
import { TextField } from "@/components/forms/TextField"
import { Button } from "@/components/ui/button"
import { AvatarEditor } from "@/features/profile/components/AvatarEditor"
import { COUNTRY_OPTIONS } from "@/features/profile/content/countries"
import { validateProfileNameFields } from "@/lib/profileValidation"
import type { UpdateProfileInput } from "@/types/account"

type ProfileEditFormProps = {
  initialFirstName: string
  initialLastName: string
  initialBirthdate?: string | null
  initialCountry?: string | null
  initialAvatarUrl?: string | null
  initials: string
  email: string
  onSave: (input: UpdateProfileInput) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  onPersistValues?: (values: { firstName: string; lastName: string }) => void
}

function ProfileEditForm({
  initialFirstName,
  initialLastName,
  initialBirthdate = null,
  initialCountry = null,
  initialAvatarUrl = null,
  initials,
  email,
  onSave,
  onCancel,
  isSubmitting = false,
  onPersistValues,
}: ProfileEditFormProps) {
  const [firstName, setFirstName] = useState(initialFirstName)
  const [lastName, setLastName] = useState(initialLastName)
  const [birthdate, setBirthdate] = useState(initialBirthdate ?? "")
  const [country, setCountry] = useState(initialCountry ?? "")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string
    lastName?: string
    birthdate?: string
  }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const countryOptions = useMemo(
    () => COUNTRY_OPTIONS.map((entry) => ({ value: entry.code, label: entry.name })),
    []
  )

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setSaveSuccess(false)

    const errors: { firstName?: string; lastName?: string; birthdate?: string } =
      validateProfileNameFields({ firstName, lastName })
    if (birthdate && !/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
      errors.birthdate = "Use a valid birthday."
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthdate: birthdate.trim() || null,
        country: country.trim() || null,
        avatarUrl: removeAvatar ? null : avatarUrl,
        avatarBlob: removeAvatar ? null : avatarBlob,
        removeAvatar,
      })
      setSaveSuccess(true)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save profile.")
    }
  }

  return (
    <form
      className="profile-drawer-form"
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
    >
      <div className="profile-drawer-section">
        <p className="profile-drawer-section-title">Profile photo</p>
        <AvatarEditor
          initials={initials}
          currentAvatarUrl={removeAvatar ? null : avatarUrl}
          previewUrl={previewUrl}
          disabled={isSubmitting || saveSuccess}
          onCropped={(blob, nextPreview) => {
            setAvatarBlob(blob)
            setRemoveAvatar(false)
            setPreviewUrl((current) => {
              if (current) URL.revokeObjectURL(current)
              return nextPreview
            })
          }}
          onRemove={() => {
            setAvatarBlob(null)
            setRemoveAvatar(true)
            setAvatarUrl(null)
            setPreviewUrl((current) => {
              if (current) URL.revokeObjectURL(current)
              return null
            })
          }}
        />
      </div>

      <div className="profile-drawer-section">
        <p className="profile-drawer-section-title">Personal information</p>
        <div className="profile-drawer-fields">
          <TextField
            label="First Name"
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => {
              const value = event.target.value
              setFirstName(value)
              onPersistValues?.({ firstName: value, lastName })
              if (fieldErrors.firstName) {
                setFieldErrors((current) => ({ ...current, firstName: undefined }))
              }
            }}
            error={fieldErrors.firstName}
            disabled={isSubmitting || saveSuccess}
          />
          <TextField
            label="Last Name"
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => {
              const value = event.target.value
              setLastName(value)
              onPersistValues?.({ firstName, lastName: value })
              if (fieldErrors.lastName) {
                setFieldErrors((current) => ({ ...current, lastName: undefined }))
              }
            }}
            error={fieldErrors.lastName}
            disabled={isSubmitting || saveSuccess}
          />
          <DateField
            label="Birthday"
            autoComplete="bday"
            value={birthdate}
            onChange={(value) => {
              setBirthdate(value)
              if (fieldErrors.birthdate) {
                setFieldErrors((current) => ({ ...current, birthdate: undefined }))
              }
            }}
            error={fieldErrors.birthdate}
            hint="Optional."
            disabled={isSubmitting || saveSuccess}
            max={new Date().toISOString().slice(0, 10)}
          />
          <Combobox
            label="Country"
            value={country}
            onChange={setCountry}
            options={countryOptions}
            placeholder="Select a country"
            searchPlaceholder="Search countries…"
            noneLabel="Prefer not to say"
            emptyLabel="No countries match"
            hint="Optional."
            disabled={isSubmitting || saveSuccess}
          />
        </div>
      </div>

      <div className="profile-drawer-section">
        <p className="profile-drawer-section-title">Sign-in email</p>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          disabled
          readOnly
          hint="Email cannot be changed here."
        />
      </div>

      {saveSuccess ? (
        <AuthFormMessage variant="success">Profile updated successfully.</AuthFormMessage>
      ) : null}
      {formError ? <AuthFormMessage>{formError}</AuthFormMessage> : null}

      <div className="profile-drawer-footer">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {saveSuccess ? "Close" : "Cancel"}
        </Button>
        {!saveSuccess ? (
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
        ) : null}
      </div>
    </form>
  )
}

export { ProfileEditForm }
