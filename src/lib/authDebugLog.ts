const AUTH_DEBUG = import.meta.env.DEV

export function logAuthInit(): void {
  if (!AUTH_DEBUG) return
  console.info("[AUTH INIT]")
}

export function logAuthLoading(value: boolean): void {
  if (!AUTH_DEBUG) return
  console.info(value ? "[AUTH LOADING TRUE]" : "[AUTH LOADING FALSE]")
}

export function logAuthSessionFound(): void {
  if (!AUTH_DEBUG) return
  console.info("[AUTH SESSION FOUND]")
}

export function logAuthSessionNull(): void {
  if (!AUTH_DEBUG) return
  console.info("[AUTH SESSION NULL]")
}

export function logAuthEvent(event: string): void {
  if (!AUTH_DEBUG) return

  switch (event) {
    case "SIGNED_IN":
      console.info("[AUTH SIGNED_IN]")
      break
    case "SIGNED_OUT":
      console.info("[AUTH SIGNED_OUT]")
      break
    case "PASSWORD_RECOVERY":
      console.info("[AUTH PASSWORD_RECOVERY]")
      break
    default:
      console.info(`[AUTH EVENT] ${event}`)
  }
}
