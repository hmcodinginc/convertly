type LogFields = Record<string, string | number | boolean | string[] | undefined>

function formatFields(fields: LogFields): string {
  return Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}=[${value.join(",")}]`
      }
      return `${key}=${value}`
    })
    .join(" ")
}

export function logStatic(message: string, fields: LogFields = {}): void {
  const suffix = formatFields(fields)
  console.info(`[STATIC] ${message}${suffix ? ` ${suffix}` : ""}`)
}

export function logQuality(message: string, fields: LogFields = {}): void {
  const suffix = formatFields(fields)
  console.info(`[QUALITY] ${message}${suffix ? ` ${suffix}` : ""}`)
}

export function logPlaywright(message: string, fields: LogFields = {}): void {
  const suffix = formatFields(fields)
  console.info(`[PLAYWRIGHT] ${message}${suffix ? ` ${suffix}` : ""}`)
}

export function logPipeline(message: string, fields: LogFields = {}): void {
  const suffix = formatFields(fields)
  console.info(`[PIPELINE] ${message}${suffix ? ` ${suffix}` : ""}`)
}
