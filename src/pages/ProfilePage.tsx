import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { useAuthSession } from "@/components/auth/AuthSessionProvider"
import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { PageLoading } from "@/components/feedback/PageState"
import { ChangePasswordDrawer } from "@/features/profile/components/ChangePasswordDrawer"
import { ChangePasswordForm } from "@/features/profile/components/ChangePasswordForm"
import { DeleteAccountModal } from "@/features/profile/components/DeleteAccountModal"
import { ProfileActionBar } from "@/features/profile/components/ProfileActionBar"
import {
  ProfileDetailsEditField,
  ProfileDetailsGrid,
  ProfileDetailsRow,
  ProfileDetailsValue,
} from "@/features/profile/components/ProfileDetailsGrid"
import { ProfileEditDrawer } from "@/features/profile/components/ProfileEditDrawer"
import { AppPageHeader } from "@/components/layout/AppPageHeader"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { Card } from "@/components/surfaces/Card"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography/Text"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import {
  clearEditDrawerState,
  clearPasswordDrawerState,
  persistEditDrawerState,
  persistPasswordDrawerState,
  readEditDrawerState,
  readPasswordDrawerState,
} from "@/lib/profileDrawerPersistence"
import {
  finalizePasswordRecovery,
  isPasswordRecoveryActive,
} from "@/lib/passwordRecoveryPersistence"
import { validateProfileNameFields } from "@/lib/profileValidation"
import { shouldUseLocalAuth } from "@/lib/env"
import { ROUTES } from "@/lib/routes"
import * as accountService from "@/services/accountService"
import * as authService from "@/services/authService"
import type { ChangePasswordInput, UpdateProfileInput } from "@/types/account"

function formatAccountDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

type ReadOnlyFieldKey = "createdAt" | "plan" | "authProvider"

const readOnlyFields: { key: ReadOnlyFieldKey; label: string }[] = [
  { key: "createdAt", label: "Account Created" },
  { key: "plan", label: "Current Plan" },
  { key: "authProvider", label: "Authentication Provider" },
]

function ProfilePage() {
  const navigate = useNavigate()
  const { account, isLoading, refreshSession, logout } = useAuthSession()
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const persistedEdit = readEditDrawerState()
  const persistedPassword = readPasswordDrawerState()
  const recoveryActiveOnLoad = isPasswordRecoveryActive()

  const [editDrawerOpen, setEditDrawerOpen] = useState(() => persistedEdit?.open ?? false)
  const [passwordDrawerOpen, setPasswordDrawerOpen] = useState(
    () => persistedPassword?.open ?? recoveryActiveOnLoad
  )
  const [isRecoveryMode, setIsRecoveryMode] = useState(
    () => recoveryActiveOnLoad || (persistedPassword?.recoveryMode ?? false)
  )
  const [editFirstName, setEditFirstName] = useState(() => persistedEdit?.firstName ?? "")
  const [editLastName, setEditLastName] = useState(() => persistedEdit?.lastName ?? "")
  const [passwordNewValue, setPasswordNewValue] = useState(
    () => persistedPassword?.newPassword ?? ""
  )
  const [passwordConfirmValue, setPasswordConfirmValue] = useState(
    () => persistedPassword?.confirmPassword ?? ""
  )
  const [mobileEditMode, setMobileEditMode] = useState(() => persistedEdit?.open ?? false)
  const [mobilePasswordMode, setMobilePasswordMode] = useState(
    () => persistedPassword?.open ?? recoveryActiveOnLoad
  )
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [mobileFirstName, setMobileFirstName] = useState("")
  const [mobileLastName, setMobileLastName] = useState("")
  const [mobileFieldErrors, setMobileFieldErrors] = useState<{
    firstName?: string
    lastName?: string
  }>({})
  const [mobileFormError, setMobileFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const recoveryDismissedRef = useRef(false)

  const resetMobileEdit = useCallback((firstName: string, lastName: string) => {
    setMobileFirstName(firstName)
    setMobileLastName(lastName)
    setMobileFieldErrors({})
    setMobileFormError(null)
  }, [])

  const syncEditPersistence = useCallback(
    (open: boolean, firstName: string, lastName: string) => {
      if (!open) {
        clearEditDrawerState()
        return
      }

      persistEditDrawerState({ open: true, firstName, lastName })
    },
    []
  )

  const syncPasswordPersistence = useCallback(
    (
      open: boolean,
      recoveryMode: boolean,
      newPassword: string,
      confirmPassword: string
    ) => {
      if (!open) {
        clearPasswordDrawerState()
        return
      }

      persistPasswordDrawerState({
        open: true,
        recoveryMode,
        newPassword,
        confirmPassword,
      })
    },
    []
  )

  const dismissRecoveryUi = useCallback(() => {
    recoveryDismissedRef.current = true
    finalizePasswordRecovery()
    clearPasswordDrawerState()
    setPasswordDrawerOpen(false)
    setMobilePasswordMode(false)
    setIsRecoveryMode(false)
    setPasswordNewValue("")
    setPasswordConfirmValue("")
    syncPasswordPersistence(false, false, "", "")
  }, [syncPasswordPersistence])

  useEffect(() => {
    if (!account || shouldUseLocalAuth() || recoveryDismissedRef.current) return

    const activateRecoveryUi = () => {
      if (recoveryDismissedRef.current || !isPasswordRecoveryActive()) return

      const persisted = readPasswordDrawerState()
      setIsRecoveryMode(true)
      setPasswordSuccess(null)

      if (isDesktop) {
        setPasswordDrawerOpen(true)
        setMobilePasswordMode(false)
      } else {
        setMobilePasswordMode(true)
        setMobileEditMode(false)
        setPasswordDrawerOpen(false)
      }

      syncPasswordPersistence(
        true,
        true,
        persisted?.newPassword ?? "",
        persisted?.confirmPassword ?? ""
      )
    }

    if (isPasswordRecoveryActive()) {
      activateRecoveryUi()
    }

    return authService.subscribeToPasswordRecovery(activateRecoveryUi)
  }, [account, isDesktop, syncPasswordPersistence])

  useEffect(() => {
    if (!account) return

    if (persistedEdit?.open && !editFirstName && !editLastName) {
      setEditFirstName(account.firstName)
      setEditLastName(account.lastName)
      resetMobileEdit(account.firstName, account.lastName)
      return
    }

    if (!persistedEdit?.open) {
      resetMobileEdit(account.firstName, account.lastName)
    }
  }, [account, editFirstName, editLastName, persistedEdit?.open, resetMobileEdit])

  const openEdit = useCallback(() => {
    if (!account) return
    setSaveSuccess(null)
    setSaveError(null)
    setEditFirstName(account.firstName)
    setEditLastName(account.lastName)
    resetMobileEdit(account.firstName, account.lastName)

    if (isDesktop) {
      setEditDrawerOpen(true)
      syncEditPersistence(true, account.firstName, account.lastName)
      return
    }

    setMobilePasswordMode(false)
    setMobileEditMode(true)
    syncEditPersistence(true, account.firstName, account.lastName)
  }, [account, isDesktop, resetMobileEdit, syncEditPersistence])

  const closeEdit = useCallback(() => {
    if (!account) return
    setEditDrawerOpen(false)
    setMobileEditMode(false)
    setEditFirstName(account.firstName)
    setEditLastName(account.lastName)
    resetMobileEdit(account.firstName, account.lastName)
    syncEditPersistence(false, account.firstName, account.lastName)
  }, [account, resetMobileEdit, syncEditPersistence])

  const closeMobilePassword = useCallback(() => {
    setMobilePasswordMode(false)
    setPasswordDrawerOpen(false)
    setPasswordNewValue("")
    setPasswordConfirmValue("")
    syncPasswordPersistence(false, isPasswordRecoveryActive(), "", "")
  }, [syncPasswordPersistence])

  const closePasswordDrawer = useCallback(() => {
    setPasswordDrawerOpen(false)
    setMobilePasswordMode(false)
    setPasswordNewValue("")
    setPasswordConfirmValue("")
    syncPasswordPersistence(false, isPasswordRecoveryActive(), "", "")
  }, [syncPasswordPersistence])

  const openChangePassword = useCallback(() => {
    setPasswordSuccess(null)
    const recovery = isPasswordRecoveryActive()
    setIsRecoveryMode(recovery)

    if (isDesktop) {
      setPasswordDrawerOpen(true)
      syncPasswordPersistence(true, recovery, passwordNewValue, passwordConfirmValue)
      return
    }

    setMobileEditMode(false)
    setMobilePasswordMode(true)
    syncPasswordPersistence(true, recovery, passwordNewValue, passwordConfirmValue)
  }, [
    isDesktop,
    passwordConfirmValue,
    passwordNewValue,
    syncPasswordPersistence,
  ])

  const handleSaveProfile = useCallback(
    async (input: UpdateProfileInput) => {
      setIsSaving(true)
      setSaveError(null)

      try {
        await accountService.updateProfile(input)
        await refreshSession()
        setSaveSuccess("Profile updated successfully.")
        if (!isDesktop) {
          setMobileEditMode(false)
        }
        setEditDrawerOpen(false)
        syncEditPersistence(false, input.firstName, input.lastName)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to save profile."
        setSaveError(message)
        throw error
      } finally {
        setIsSaving(false)
      }
    },
    [isDesktop, refreshSession, syncEditPersistence]
  )

  const handleMobileSave = useCallback(async () => {
    setMobileFormError(null)
    const errors = validateProfileNameFields({
      firstName: mobileFirstName,
      lastName: mobileLastName,
    })
    setMobileFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await handleSaveProfile({
        firstName: mobileFirstName.trim(),
        lastName: mobileLastName.trim(),
      })
    } catch (error) {
      setMobileFormError(
        error instanceof Error ? error.message : "Unable to save profile."
      )
    }
  }, [handleSaveProfile, mobileFirstName, mobileLastName])

  const handleChangePassword = useCallback(
    async (input: ChangePasswordInput) => {
      if (!account) return

      setIsChangingPassword(true)
      setPasswordSuccess(null)

      try {
        if (isRecoveryMode || isPasswordRecoveryActive()) {
          await authService.completePasswordRecovery(input.newPassword, { keepSession: true })
          dismissRecoveryUi()
          setPasswordSuccess("Password updated successfully.")
          await refreshSession()
        } else {
          await accountService.changePassword(account.email, input)
          finalizePasswordRecovery()
          setPasswordSuccess("Password updated successfully.")
          setPasswordDrawerOpen(false)
          setMobilePasswordMode(false)
          setPasswordNewValue("")
          setPasswordConfirmValue("")
          clearPasswordDrawerState()
          syncPasswordPersistence(false, false, "", "")
        }
      } catch (error) {
        throw error
      } finally {
        setIsChangingPassword(false)
      }
    },
    [account, dismissRecoveryUi, isRecoveryMode, refreshSession, syncPasswordPersistence]
  )

  const handleForgotPassword = useCallback(async () => {
    if (!account) return
    await accountService.requestAccountPasswordReset(account.email)
  }, [account])

  const handleDeleteAccount = useCallback(async () => {
    await accountService.deleteAccount()
    await logout()
    navigate(ROUTES.home, {
      replace: true,
      state: { accountDeleted: true },
    })
  }, [logout, navigate])

  if (isLoading) {
    return (
      <AppPageShell>
        <PageLoading label="Loading profile…" />
      </AppPageShell>
    )
  }

  if (!account) {
    return (
      <AppPageShell
        header={
          <AppPageHeader
            eyebrow="Account"
            title="Profile"
            description="Your Convertly account details."
          />
        }
      >
        <Card className="app-card-body app-card-stack profile-card hover:translate-y-0">
          <Text variant="muted" size="sm" className="max-w-none">
            Unable to load account information. Try signing in again.
          </Text>
          <Button variant="outline" size="sm" className="h-9" asChild>
            <Link to={ROUTES.login}>Go to login</Link>
          </Button>
        </Card>
      </AppPageShell>
    )
  }

  const readOnlyValues: Record<ReadOnlyFieldKey, string> = {
    createdAt: formatAccountDate(account.createdAt),
    plan: account.plan,
    authProvider: account.authProvider,
  }

  const isEditing = mobileEditMode && !isDesktop
  const isMobilePasswordActive = mobilePasswordMode && !isDesktop
  const hideMobileActionBar =
    !isDesktop && (isEditing || isMobilePasswordActive || deleteModalOpen)

  return (
    <AppPageShell
      header={
        <AppPageHeader
          eyebrow="Account"
          title="Profile"
          description="View and manage your Convertly account details."
        />
      }
    >
      <Card className="app-card-body profile-card app-card-stack hover:translate-y-0">
        <div
          className={
            hideMobileActionBar ? "profile-header profile-header--compact" : "profile-header"
          }
        >
          <div className="profile-identity">
            <span
              aria-hidden
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7c6cff_0%,#5d7dff_52%,#35b3ff_100%)] text-base font-semibold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
            >
              {account.initials}
            </span>
            <div className="min-w-0">
              <Text size="sm" className="max-w-none font-medium">
                {account.fullName}
              </Text>
              <Text variant="muted" size="sm" className="mt-1 max-w-none">
                {account.email}
              </Text>
            </div>
          </div>

          {!hideMobileActionBar ? (
            <ProfileActionBar
              onEdit={openEdit}
              onChangePassword={openChangePassword}
              onDelete={() => setDeleteModalOpen(true)}
            />
          ) : null}
        </div>

        {saveSuccess ? (
          <AuthFormMessage variant="success">{saveSuccess}</AuthFormMessage>
        ) : null}
        {passwordSuccess ? (
          <AuthFormMessage variant="success">{passwordSuccess}</AuthFormMessage>
        ) : null}
        {saveError && !isEditing && !editDrawerOpen ? (
          <AuthFormMessage>{saveError}</AuthFormMessage>
        ) : null}

        {isMobilePasswordActive ? (
          <ChangePasswordForm
            email={account.email}
            onChangePassword={handleChangePassword}
            onForgotPassword={handleForgotPassword}
            onCancel={closeMobilePassword}
            isSubmitting={isChangingPassword}
            recoveryMode={isRecoveryMode}
            initialNewPassword={passwordNewValue}
            initialConfirmPassword={passwordConfirmValue}
            onPersistValues={({ newPassword, confirmPassword }) => {
              if (recoveryDismissedRef.current) return
              setPasswordNewValue(newPassword)
              setPasswordConfirmValue(confirmPassword)
              if (!passwordDrawerOpen && !mobilePasswordMode) return
              syncPasswordPersistence(true, isRecoveryMode, newPassword, confirmPassword)
            }}
          />
        ) : null}

        {!isMobilePasswordActive ? (
        <div className="profile-details-panel">
          <ProfileDetailsGrid>
            <ProfileDetailsRow label="First Name">
              {isEditing ? (
                <ProfileDetailsEditField
                  label="First Name"
                  value={mobileFirstName}
                  onChange={setMobileFirstName}
                  error={mobileFieldErrors.firstName}
                  disabled={isSaving}
                  autoComplete="given-name"
                />
              ) : (
                <ProfileDetailsValue value={account.firstName} />
              )}
            </ProfileDetailsRow>

            <ProfileDetailsRow label="Last Name">
              {isEditing ? (
                <ProfileDetailsEditField
                  label="Last Name"
                  value={mobileLastName}
                  onChange={setMobileLastName}
                  error={mobileFieldErrors.lastName}
                  disabled={isSaving}
                  autoComplete="family-name"
                />
              ) : (
                <ProfileDetailsValue value={account.lastName} />
              )}
            </ProfileDetailsRow>

            <ProfileDetailsRow label="Email">
              <ProfileDetailsValue value={account.email} />
            </ProfileDetailsRow>

            {readOnlyFields.map((field) => (
              <ProfileDetailsRow key={field.key} label={field.label}>
                <ProfileDetailsValue value={readOnlyValues[field.key]} />
              </ProfileDetailsRow>
            ))}
          </ProfileDetailsGrid>
        </div>
        ) : null}

        {isEditing ? (
          <div className="mt-4 space-y-3 border-t border-[color-mix(in_srgb,var(--border)_50%,transparent)] pt-4">
            {mobileFormError ? <AuthFormMessage>{mobileFormError}</AuthFormMessage> : null}
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 min-h-9"
                onClick={closeEdit}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-9 min-h-9"
                onClick={() => void handleMobileSave()}
                disabled={isSaving}
              >
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <ProfileEditDrawer
        open={editDrawerOpen && isDesktop}
        firstName={editFirstName || account.firstName}
        lastName={editLastName || account.lastName}
        email={account.email}
        isSubmitting={isSaving}
        onClose={closeEdit}
        onSave={handleSaveProfile}
        onPersistValues={({ firstName, lastName }) => {
          setEditFirstName(firstName)
          setEditLastName(lastName)
          syncEditPersistence(true, firstName, lastName)
        }}
      />

      <ChangePasswordDrawer
        open={passwordDrawerOpen && isDesktop}
        email={account.email}
        isSubmitting={isChangingPassword}
        recoveryMode={isRecoveryMode}
        initialNewPassword={passwordNewValue}
        initialConfirmPassword={passwordConfirmValue}
        onClose={closePasswordDrawer}
        onChangePassword={handleChangePassword}
        onForgotPassword={handleForgotPassword}
        onPersistValues={({ newPassword, confirmPassword }) => {
          if (recoveryDismissedRef.current) return
          setPasswordNewValue(newPassword)
          setPasswordConfirmValue(confirmPassword)
          if (!passwordDrawerOpen && !mobilePasswordMode) return
          syncPasswordPersistence(true, isRecoveryMode, newPassword, confirmPassword)
        }}
      />

      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirmDelete={handleDeleteAccount}
      />
    </AppPageShell>
  )
}

export default ProfilePage
