import { Turnstile } from "@marsidev/react-turnstile"
import { useState } from "react"

import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { env, isCaptchaEnabled } from "@/lib/env"

type AuthCaptchaProps = {
  onToken: (token: string | null) => void
  className?: string
}

/**
 * Cloudflare Turnstile widget for Supabase Auth CAPTCHA.
 * Renders nothing when CAPTCHA is not configured (no site key, or local auth).
 * Surfaces a clear error if Turnstile fails to initialize.
 */
function AuthCaptcha({ onToken, className }: AuthCaptchaProps) {
  const [initError, setInitError] = useState<string | null>(null)

  if (!isCaptchaEnabled()) {
    return null
  }

  return (
    <div className={className}>
      {initError ? <AuthFormMessage>{initError}</AuthFormMessage> : null}
      <Turnstile
        siteKey={env.turnstileSiteKey}
        options={{
          theme: "dark",
          size: "flexible",
        }}
        onSuccess={(token) => {
          setInitError(null)
          onToken(token)
        }}
        onExpire={() => onToken(null)}
        onError={() => {
          onToken(null)
          setInitError(
            "Security check failed to load. Refresh the page, or check that this domain is allowed in Cloudflare Turnstile."
          )
        }}
        onUnsupported={() => {
          onToken(null)
          setInitError(
            "Security check is not supported in this browser. Try another browser, or refresh the page."
          )
        }}
      />
    </div>
  )
}

export { AuthCaptcha }
