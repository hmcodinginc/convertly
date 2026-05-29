import { useCallback } from "react"
import { useNavigate } from "react-router-dom"

import * as authService from "@/services/authService"

export function useAppAuthNavigate() {
  const navigate = useNavigate()

  const navigateWithSession = useCallback(
    async (path: string) => {
      await authService.ensureMockSession()
      navigate(path)
    },
    [navigate]
  )

  return { navigateWithSession }
}
