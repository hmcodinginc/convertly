const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
])

export function isPrivateIpv4(hostname) {
  const parts = hostname.split(".").map((part) => Number(part))
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false
  }

  const [a, b] = parts
  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 192 && b === 168) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  return false
}

export function isBlockedHostname(hostname) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "")

  if (BLOCKED_HOSTNAMES.has(normalized)) return true
  if (normalized.endsWith(".localhost")) return true
  if (normalized.endsWith(".local")) return true
  if (normalized.endsWith(".internal")) return true
  if (isPrivateIpv4(normalized)) return true

  return false
}

export function assertSafeUrl(rawUrl) {
  let parsed

  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error("Invalid URL")
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are allowed")
  }

  if (!parsed.hostname.includes(".")) {
    throw new Error("Invalid hostname")
  }

  if (isBlockedHostname(parsed.hostname)) {
    throw new Error("Blocked hostname")
  }

  return parsed
}
