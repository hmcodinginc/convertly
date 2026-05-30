import { useCallback } from "react"
import { useNavigate } from "react-router-dom"

import { ROUTES } from "@/lib/routes"
import * as authService from "@/services/authService"

export function useAppAuthNavigate() {
  const navigate = useNavigate()

  const navigateWithSession = useCallback(
    async (path: string) => {
      const authenticated = await authService.isAuthenticated()

      if (authenticated) {
        navigate(path)
        return
      }

      navigate(ROUTES.signup, { state: { from: path } })
    },
    [navigate]
  )

  return { navigateWithSession }
}
