import { Drawer } from "@/components/feedback/Drawer"
import { ChangePasswordForm } from "@/features/profile/components/ChangePasswordForm"
import type { ChangePasswordInput } from "@/types/account"

type ChangePasswordDrawerProps = {
  open: boolean
  email: string
  isSubmitting: boolean
  recoveryMode?: boolean
  initialNewPassword?: string
  initialConfirmPassword?: string
  onClose: () => void
  onChangePassword: (input: ChangePasswordInput) => Promise<void>
  onForgotPassword: () => Promise<void>
  onPersistValues?: (values: { newPassword: string; confirmPassword: string }) => void
}

function ChangePasswordDrawer({
  open,
  email,
  isSubmitting,
  recoveryMode = false,
  initialNewPassword = "",
  initialConfirmPassword = "",
  onClose,
  onChangePassword,
  onForgotPassword,
  onPersistValues,
}: ChangePasswordDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={recoveryMode ? "Reset password" : "Change password"}
      description={
        recoveryMode
          ? "Choose a strong password for your Convertly account."
          : "Choose a strong password you do not use elsewhere."
      }
      side="right"
      className="max-w-md"
      contentClassName="!py-5"
    >
      <ChangePasswordForm
        email={email}
        onChangePassword={onChangePassword}
        onForgotPassword={onForgotPassword}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        recoveryMode={recoveryMode}
        initialNewPassword={initialNewPassword}
        initialConfirmPassword={initialConfirmPassword}
        onPersistValues={onPersistValues}
      />
    </Drawer>
  )
}

export { ChangePasswordDrawer }
