import type { AuditUrlValidationResult } from "@/types/auditEngine"

const BLOCKED_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"])

function stripControlCharacters(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim()
}

export function sanitizeAuditUrl(value: string): string {
  const cleaned = stripControlCharacters(value)
  if (!cleaned) return ""

  const withProtocol = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`

  try {
    const parsed = new URL(withProtocol)
    parsed.hash = ""
    return parsed.toString().replace(/\/$/, "") || parsed.origin
  } catch {
    return cleaned
  }
}

export function parseDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`)
    return parsed.hostname.replace(/^www\./, "")
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0] ?? url
  }
}

function validateUrlFormat(url: string): { valid: boolean; errors: string[]; parsed?: URL } {
  const errors: string[] = []

  try {
    const parsed = new URL(url)

    if (!parsed.hostname.includes(".")) {
      errors.push("Enter a valid domain (e.g. example.com)")
    }

    if (BLOCKED_HOSTNAMES.has(parsed.hostname)) {
      errors.push("Local addresses cannot be audited")
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      errors.push("Only HTTP and HTTPS URLs are supported")
    }

    return { valid: errors.length === 0, errors, parsed }
  } catch {
    return { valid: false, errors: ["Enter a valid website URL (e.g. https://example.com)"] }
  }
}

async function checkHttpsSupport(url: string): Promise<{ supported: boolean; warning?: string }> {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === "https:") {
      return { supported: true }
    }

    const httpsUrl = url.replace(/^http:/i, "https:")
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 5000)

    try {
      await fetch(httpsUrl, {
        method: "HEAD",
        mode: "no-cors",
        signal: controller.signal,
      })
      return {
        supported: true,
        warning: "HTTP URL provided — audit will use HTTPS",
      }
    } catch {
      return {
        supported: false,
        warning: "HTTPS could not be verified for this URL",
      }
    } finally {
      window.clearTimeout(timeout)
    }
  } catch {
    return { supported: false, warning: "HTTPS could not be verified for this URL" }
  }
}

export async function validateAuditUrl(rawUrl: string): Promise<AuditUrlValidationResult> {
  const sanitizedUrl = sanitizeAuditUrl(rawUrl)
  const errors: string[] = []
  const warnings: string[] = []

  if (!sanitizedUrl) {
    return {
      valid: false,
      sanitizedUrl: "",
      domain: "",
      errors: ["Enter a website URL to audit"],
      warnings,
    }
  }

  const formatResult = validateUrlFormat(sanitizedUrl)
  errors.push(...formatResult.errors)

  if (!formatResult.valid || !formatResult.parsed) {
    return {
      valid: false,
      sanitizedUrl,
      domain: parseDomainFromUrl(sanitizedUrl),
      errors,
      warnings,
    }
  }

  let finalUrl = sanitizedUrl
  if (formatResult.parsed.protocol === "http:") {
    finalUrl = sanitizedUrl.replace(/^http:/i, "https:")
    warnings.push("HTTP URLs are upgraded to HTTPS for auditing")
  }

  const httpsCheck = await checkHttpsSupport(finalUrl)
  if (httpsCheck.warning) {
    warnings.push(httpsCheck.warning)
  }

  // Require HTTPS scheme; reachability is best-effort due to browser CORS limits
  if (!finalUrl.startsWith("https://")) {
    errors.push("Audits require an HTTPS URL")
  }

  return {
    valid: errors.length === 0,
    sanitizedUrl: finalUrl,
    domain: parseDomainFromUrl(finalUrl),
    errors,
    warnings,
  }
}

export function isValidAuditUrlFormat(value: string): boolean {
  const sanitized = sanitizeAuditUrl(value)
  return validateUrlFormat(sanitized).valid
}
