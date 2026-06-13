import { Drawer } from "@/components/feedback/Drawer"
import { ProfileEditForm } from "@/features/profile/components/ProfileEditForm"
import type { UpdateProfileInput } from "@/types/account"

type ProfileEditDrawerProps = {
  open: boolean
  firstName: string
  lastName: string
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
      description="Update your name and review your sign-in email."
      side="right"
      className="max-w-md"
      contentClassName="!py-5"
    >
      <ProfileEditForm
        initialFirstName={firstName}
        initialLastName={lastName}
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
