import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { BusinessFoundationRequired } from "@/components/business/BusinessFoundationRequired"
import { DeleteAccountModal } from "@/features/profile/components/DeleteAccountModal"
import { SettingsSectionCard } from "@/components/settings/SettingsSectionCard"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography/Text"
import { useAuthSession } from "@/hooks/useAuthSession"
import { isBusinessFoundationEnabled } from "@/lib/businessFoundation"
import { ROUTES } from "@/lib/routes"
import * as accountService from "@/services/accountService"

function SettingsDangerZonePage() {
  const navigate = useNavigate()
  const { logout } = useAuthSession()
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (!isBusinessFoundationEnabled()) {
    return <BusinessFoundationRequired />
  }

  async function handleDelete() {
    await accountService.deleteAccount()
    await logout()
    navigate(ROUTES.home, { replace: true, state: { accountDeleted: true } })
  }

  return (
    <>
      <SettingsSectionCard
        title="Danger zone"
        description="Permanently delete your account and all associated data."
      >
        <Text variant="muted" size="sm" className="max-w-none leading-6">
          Deleting your account removes audits, workspace domains, subscription records, and
          settings. This action cannot be undone.
        </Text>
        <Button
          variant="outline"
          size="sm"
          className="profile-delete-btn mt-2"
          onClick={() => setDeleteOpen(true)}
        >
          Delete account
        </Button>
      </SettingsSectionCard>

      <DeleteAccountModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirmDelete={handleDelete}
      />
    </>
  )
}

export default SettingsDangerZonePage
