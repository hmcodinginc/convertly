import { Drawer } from "@/components/feedback/Drawer"
import { ProfileEditForm } from "@/features/profile/components/ProfileEditForm"
import type { UpdateProfileInput } from "@/types/account"

type ProfileEditDrawerProps = {
  open: boolean
  firstName: string
  lastName: string
  birthdate?: string | null
  country?: string | null
  avatarUrl?: string | null
  initials: string
  email: string
  isSubmitting: boolean
  onClose: () => void
  onSave: (input: UpdateProfileInput) => Promise<void>
  onPersistValues?: (values: { firstName: string; lastName: string }) => void
}

function ProfileEditDrawer({
  open,
  firstName,
  lastName,
  birthdate,
  country,
  avatarUrl,
  initials,
  email,
  isSubmitting,
  onClose,
  onSave,
  onPersistValues,
}: ProfileEditDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Edit profile"
      description="Update your details. Birthday, country, and photo are optional."
      side="right"
      className="profile-edit-drawer max-w-[min(100vw-1rem,36rem)]"
      contentClassName="!py-5"
    >
      <ProfileEditForm
        key={`${firstName}-${lastName}-${birthdate ?? ""}-${country ?? ""}-${avatarUrl ?? ""}-${open}`}
        initialFirstName={firstName}
        initialLastName={lastName}
        initialBirthdate={birthdate}
        initialCountry={country}
        initialAvatarUrl={avatarUrl}
        initials={initials}
        email={email}
        onSave={onSave}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        onPersistValues={onPersistValues}
      />
    </Drawer>
  )
}

export { ProfileEditDrawer }
