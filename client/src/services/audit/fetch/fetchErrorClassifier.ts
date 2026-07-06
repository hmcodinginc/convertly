
export type FetchFailureKind =
  | "bot_protection"
  | "cloudflare"
  | "timeout"
  | "dns"
  | "ssl"
  | "network"
  | "connection_refused"
  | "authentication_required"
  | "rate_limited"
  | "robots_blocked"
  | "javascript_render_failed"
  | "not_html"
  | "blocked"
  | "unreachable"
  | "response_too_large"
  | "redirect_loop"
  | "unknown"

export type ClassifiedFetchFailure = {
  kind: FetchFailureKind
  userMessage: string
}

const BOT_PROTECTION_PATTERNS = [
  /access denied/i,
  /bot detected/i,
  /automated access/i,
  /request blocked/i,
  /captcha/i,
  /forbidden.*bot/i,
  /unusual traffic/i,
]

const CLOUDFLARE_PATTERNS = [
  /cloudflare/i,
  /cf-ray/i,
  /checking your browser/i,
  /attention required/i,
  /just a moment/i,
  /cf-browser-verification/i,
  /challenge-platform/i,
]

const ROBOTS_PATTERNS = [/robots\.txt/i, /disallowed by robots/i, /crawl disallowed/i]

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}

/**
 * Classifies fetch/render failures into user-actionable categories.
 */
export function classifyFetchFailure(input: {
  error?: string
  status?: number
  html?: string | null
  finalUrl?: string
}): ClassifiedFetchFailure {
  const error = input.error?.trim() ?? ""
  const status = input.status ?? 0
  const htmlSnippet = (input.html ?? "").slice(0, 4000)
  const combined = `${error} ${htmlSnippet}`.toLowerCase()

  if (error.includes("Blocked hostname") || error.includes("Only HTTPS")) {
    return {
      kind: "blocked",
      userMessage:
        "This URL cannot be audited for security reasons. Use a public HTTPS website.",
    }
  }

  if (
    error.includes("Response too large") ||
    combined.includes("response too large") ||
    combined.includes("body exceeded") ||
    combined.includes("max_html_bytes")
  ) {
    return {
      kind: "response_too_large",
      userMessage:
        "The homepage HTML response was too large for static fetch. We will attempt browser rendering instead.",
    }
  }

  if (
    error.includes("ERR_TOO_MANY_REDIRECTS") ||
    combined.includes("too many redirects") ||
    combined.includes("redirect loop") ||
    combined.includes("maximum redirect")
  ) {
    return {
      kind: "redirect_loop",
      userMessage:
        "The website redirected too many times. Check for redirect loops or geo-based routing that blocks automated access.",
    }
  }

  if (
    error.includes("abort") ||
    error.includes("timeout") ||
    error.includes("timed out") ||
    error.includes("Timeout")
  ) {
    return {
      kind: "timeout",
      userMessage:
        "The website took too long to respond. It may be slow, overloaded, or blocking automated requests.",
    }
  }

  if (
    error.includes("ENOTFOUND") ||
    error.includes("getaddrinfo") ||
    error.includes("DNS") ||
    error.includes("Name or service not known") ||
    combined.includes("nxdomain")
  ) {
    return {
      kind: "dns",
      userMessage:
        "The domain could not be resolved. Check the URL spelling or confirm the site is publicly registered.",
    }
  }

  if (
    error.includes("certificate") ||
    error.includes("SSL") ||
    error.includes("TLS") ||
    error.includes("CERT_") ||
    combined.includes("ssl handshake")
  ) {
    return {
      kind: "ssl",
      userMessage:
        "A secure connection could not be established. The site may have an invalid or expired SSL certificate.",
    }
  }

  if (
    error.includes("ECONNREFUSED") ||
    combined.includes("connection refused")
  ) {
    return {
      kind: "connection_refused",
      userMessage:
        "The server refused the connection. The site may be offline or blocking our crawler IP.",
    }
  }

  if (
    error.includes("render failed") ||
    error.includes("JavaScript rendering did not complete") ||
    error.includes("active network activity") ||
    error.includes("JavaScript") ||
    error.includes("hydration") ||
    error.includes("page.evaluate")
  ) {
    return {
      kind: "javascript_render_failed",
      userMessage:
        "JavaScript rendering failed while loading this page. The site may require a browser environment we could not complete.",
    }
  }

  if (matchesAny(combined, CLOUDFLARE_PATTERNS) || (status === 403 && combined.includes("cloudflare"))) {
    return {
      kind: "cloudflare",
      userMessage:
        "Cloudflare protection blocked our crawler. The site may require human verification before it can be audited.",
    }
  }

  if (status === 401 || combined.includes("authentication required") || combined.includes("sign in to continue")) {
    return {
      kind: "authentication_required",
      userMessage:
        "Authentication is required to access this website. Public pages must be reachable without logging in.",
    }
  }

  if (status === 429 || combined.includes("rate limit") || combined.includes("too many requests")) {
    return {
      kind: "rate_limited",
      userMessage:
        "The website rate-limited our requests. Try again later or verify the site allows automated access.",
    }
  }

  if (matchesAny(combined, ROBOTS_PATTERNS)) {
    return {
      kind: "robots_blocked",
      userMessage:
        "Crawling was blocked by robots.txt or site policy. We can only audit publicly crawlable pages.",
    }
  }

  if (matchesAny(combined, BOT_PROTECTION_PATTERNS) || status === 403) {
    return {
      kind: "bot_protection",
      userMessage:
        "The website blocked automated access. Protected platforms often cannot be crawled without human verification.",
    }
  }

  if (
    error.includes("Failed to fetch") ||
    error.includes("NetworkError") ||
    error.includes("network") ||
    error.includes("ECONNRESET") ||
    error.includes("socket")
  ) {
    return {
      kind: "network",
      userMessage:
        "A network error prevented us from reaching the website. Verify the site is online and publicly accessible.",
    }
  }

  if (error.includes("not HTML") || error.includes("Response is not HTML")) {
    return {
      kind: "not_html",
      userMessage:
        "The URL did not return HTML content. Audits require a public web page, not an API or file download.",
    }
  }

  if (status >= 500) {
    return {
      kind: "unreachable",
      userMessage: `The website returned a server error (${status}). Try again later or verify the URL is correct.`,
    }
  }

  if (status === 404) {
    return {
      kind: "unreachable",
      userMessage: "The homepage returned 404 Not Found. Verify the URL points to a live page.",
    }
  }

  if (status >= 400) {
    return {
      kind: "unreachable",
      userMessage: `The website returned HTTP ${status}. The page may be private or unavailable.`,
    }
  }

  if (error) {
    return {
      kind: "unknown",
      userMessage: `Unable to fetch the website: ${error}`,
    }
  }

  return {
    kind: "unknown",
    userMessage: "Unable to reach the website. Verify the URL is public and accessible over HTTPS.",
  }
}
