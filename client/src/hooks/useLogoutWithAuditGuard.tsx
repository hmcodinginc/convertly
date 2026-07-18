import { useCallback, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Modal } from "@/components/feedback/Modal"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography/Text"
import { useAuthSession } from "@/hooks/useAuthSession"
import { isAuditInProgress } from "@/lib/auditStatus"
import { ROUTES } from "@/lib/routes"
import * as auditService from "@/services/auditService"

type UseLogoutWithAuditGuardOptions = {
  onBeforeLogout?: () => void
  redirectTo?: string
}

/**
 * Wraps logout with a confirmation dialog when an audit is actively running.
 */
function useLogoutWithAuditGuard(options: UseLogoutWithAuditGuardOptions = {}) {
  const { logout } = useAuthSession()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const onBeforeLogoutRef = useRef(options.onBeforeLogout)
  const redirectToRef = useRef(options.redirectTo ?? ROUTES.login)
  onBeforeLogoutRef.current = options.onBeforeLogout
  redirectToRef.current = options.redirectTo ?? ROUTES.login

  const performLogout = useCallback(async () => {
    setIsLoggingOut(true)
    try {
      onBeforeLogoutRef.current?.()
      await logout()
      navigate(redirectToRef.current, { replace: true })
    } finally {
      setIsLoggingOut(false)
      setConfirmOpen(false)
    }
  }, [logout, navigate])

  const requestLogout = useCallback(async () => {
    try {
      const audits = await auditService.getAudits()
      const hasRunning = audits.some((audit) => isAuditInProgress(audit.status))
      if (hasRunning) {
        setConfirmOpen(true)
        return
      }
      await performLogout()
    } catch {
      await performLogout()
    }
  }, [performLogout])

  const logoutConfirmModal = (
    <Modal
      open={confirmOpen}
      onClose={() => {
        if (!isLoggingOut) setConfirmOpen(false)
      }}
      title="Audit is currently running"
      description="Logging out may interrupt the audit."
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isLoggingOut}
            onClick={() => setConfirmOpen(false)}
          >
            Stay Logged In
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isLoggingOut}
            onClick={() => void performLogout()}
          >
            {isLoggingOut ? "Logging out…" : "Logout Anyway"}
          </Button>
        </div>
      }
    >
      <Text size="sm" className="max-w-none leading-6 text-foreground/80">
        An audit is still in progress. If you log out now, Convertly may not be able to finish
        it. You can stay signed in and wait, or log out anyway and run the audit again later.
      </Text>
    </Modal>
  )

  return {
    requestLogout,
    isLoggingOut,
    logoutConfirmModal,
  }
}

export { useLogoutWithAuditGuard }
