import { Drawer } from "@/components/feedback/Drawer"
import { ChangePasswordForm } from "@/features/profile/components/ChangePasswordForm"
import type { ChangePasswordInput } from "@/types/account"

type ChangePasswordDrawerProps = {
  open: boolean
  email: string
  isSubmitting: boolean
  onClose: () => void
  onChangePassword: (input: ChangePasswordInput) => Promise<void>
  onForgotPassword: () => Promise<void>
}

function ChangePasswordDrawer({
  open,
  email,
  isSubmitting,
  onClose,
  onChangePassword,
  onForgotPassword,
}: ChangePasswordDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Change password"
      description="Choose a strong password you do not use elsewhere."
      side="right"
      className="max-w-md"
      contentClassName="!py-5"
    >
      <ChangePasswordForm
        key={`${open}-${email}`}
        email={email}
        onChangePassword={onChangePassword}
        onForgotPassword={onForgotPassword}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </Drawer>
  )
}

export { ChangePasswordDrawer }
