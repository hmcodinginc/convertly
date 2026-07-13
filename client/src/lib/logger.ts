type LogLevel = "warn" | "error"

function write(level: LogLevel, scope: string, message: string, data?: Record<string, unknown>): void {
  const prefix = `[Convertly${scope ? `:${scope}` : ""}]`
  const payload = data && Object.keys(data).length > 0 ? data : undefined

  switch (level) {
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
    warn: (message: string, data?: Record<string, unknown>) => write("warn", scope, message, data),
    error: (message: string, data?: Record<string, unknown>) => write("error", scope, message, data),
  }
}

export const auditLogger = createLogger("audit")
