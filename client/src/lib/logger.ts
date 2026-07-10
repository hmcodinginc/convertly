type LogLevel = "debug" | "info" | "warn" | "error"

/** Debug/verbose output only when explicitly enabled or in Vite dev mode. */
export function isAuditDebugEnabled(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_AUDIT_DEBUG === "true"
}

function write(level: LogLevel, scope: string, message: string, data?: Record<string, unknown>): void {
  if ((level === "debug" || level === "info") && !isAuditDebugEnabled()) return

  const prefix = `[Convertly${scope ? `:${scope}` : ""}]`
  const payload = data && Object.keys(data).length > 0 ? data : undefined

  switch (level) {
    case "debug":
      if (payload) console.debug(prefix, message, payload)
      else console.debug(prefix, message)
      break
    case "info":
      if (payload) console.info(prefix, message, payload)
      else console.info(prefix, message)
      break
    case "warn":
      if (payload) console.warn(prefix, message, payload)
      else console.warn(prefix, message)
      break
    case "error":
      if (payload) console.error(prefix, message, payload)
      else console.error(prefix, message)
      break
  }
}

export function createLogger(scope: string) {
  return {
    debug: (message: string, data?: Record<string, unknown>) => write("debug", scope, message, data),
    info: (message: string, data?: Record<string, unknown>) => write("info", scope, message, data),
    warn: (message: string, data?: Record<string, unknown>) => write("warn", scope, message, data),
    error: (message: string, data?: Record<string, unknown>) => write("error", scope, message, data),
  }
}

export const auditLogger = createLogger("audit")
