import { useEffect, useRef, useState } from "react"
import {
  DEFAULT_ONLOAD_NAME,
  DEFAULT_SCRIPT_ID,
  SCRIPT_URL,
} from "@marsidev/react-turnstile"

import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { env, isCaptchaEnabled } from "@/lib/env"

type AuthCaptchaProps = {
  onToken: (token: string | null) => void
  className?: string
  /** Change this to reset the widget without remounting the container. */
  resetNonce?: number
}

function getTurnstileApi() {
  return window.turnstile
}

function ensureTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile requires a browser."))
  }

  if (getTurnstileApi()) {
    return Promise.resolve()
  }

  const existing = document.getElementById(DEFAULT_SCRIPT_ID)
  if (existing) {
    return new Promise((resolve, reject) => {
      const started = Date.now()
      const timer = window.setInterval(() => {
        if (getTurnstileApi()) {
          window.clearInterval(timer)
          resolve()
          return
        }
        if (Date.now() - started > 15000) {
          window.clearInterval(timer)
          reject(new Error("Timed out waiting for Turnstile script."))
        }
      }, 50)
    })
  }

  return new Promise((resolve, reject) => {
    const callbackName = DEFAULT_ONLOAD_NAME
    const win = window as unknown as Record<string, unknown>
    win[callbackName] = () => {
      delete win[callbackName]
      resolve()
    }

    const script = document.createElement("script")
    script.id = DEFAULT_SCRIPT_ID
    script.src = `${SCRIPT_URL}?onload=${callbackName}&render=explicit`
    script.async = true
    script.defer = true
    script.onerror = () => {
      delete win[callbackName]
      reject(new Error("Failed to load Turnstile script."))
    }
    document.head.appendChild(script)
  })
}

/**
 * Cloudflare Turnstile for Supabase Auth CAPTCHA.
 *
 * Uses explicit render against a stable container ref. Avoid remounting this
 * component via React `key` while a challenge is in flight — that destroys the
 * iframe and surfaces postMessage origin mismatches / error 300010.
 */
function AuthCaptcha({ onToken, className, resetNonce = 0 }: AuthCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const onTokenRef = useRef(onToken)
  const [initError, setInitError] = useState<string | null>(null)

  onTokenRef.current = onToken

  useEffect(() => {
    if (!isCaptchaEnabled()) return

    let cancelled = false

    async function mount() {
      try {
        await ensureTurnstileScript()
        if (cancelled) return

        const container = containerRef.current
        const turnstile = getTurnstileApi()
        if (!container || widgetIdRef.current) return
        if (!turnstile) {
          throw new Error("Turnstile API unavailable after script load.")
        }

        // Clear any leftover nodes from a prior StrictMode cycle.
        container.innerHTML = ""

        const widgetId = turnstile.render(container, {
          sitekey: env.turnstileSiteKey,
          theme: "dark",
          size: "flexible",
          callback: (token: string) => {
            setInitError(null)
            onTokenRef.current(token)
          },
          "expired-callback": () => {
            onTokenRef.current(null)
          },
          "error-callback": () => {
            onTokenRef.current(null)
            setInitError(
              "Security check failed to load. Refresh the page, or try another browser / disable blockers."
            )
            return true
          },
          "unsupported-callback": () => {
            onTokenRef.current(null)
            setInitError(
              "Security check is not supported in this browser. Try another browser, or refresh the page."
            )
          },
        })

        if (!widgetId) {
          throw new Error("Turnstile render returned no widget id.")
        }

        if (cancelled) {
          turnstile.remove(widgetId)
          return
        }

        widgetIdRef.current = widgetId
      } catch (error) {
        if (cancelled) return
        onTokenRef.current(null)
        setInitError(
          error instanceof Error
            ? error.message
            : "Security check failed to load. Refresh the page."
        )
      }
    }

    void mount()

    return () => {
      cancelled = true
      const widgetId = widgetIdRef.current
      const turnstile = getTurnstileApi()
      if (widgetId && turnstile) {
        try {
          turnstile.remove(widgetId)
        } catch {
          /* ignore cleanup errors */
        }
      }
      widgetIdRef.current = null
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [])

  useEffect(() => {
    const widgetId = widgetIdRef.current
    const turnstile = getTurnstileApi()
    if (!resetNonce || !widgetId || !turnstile) return
    try {
      onTokenRef.current(null)
      turnstile.reset(widgetId)
    } catch {
      /* ignore reset errors */
    }
  }, [resetNonce])

  if (!isCaptchaEnabled()) {
    return null
  }

  return (
    <div className={className}>
      {initError ? <AuthFormMessage>{initError}</AuthFormMessage> : null}
      <div
        ref={containerRef}
        data-turnstile-container
        className="min-h-[65px] w-full min-w-[300px]"
      />
    </div>
  )
}

export { AuthCaptcha }
