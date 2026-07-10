import { setJson } from "@/services/storage/sessionStorageClient"

const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js"
const CHECKOUT_DEBUG_RESPONSE_KEY = "convertly:checkout-debug-response"

type RazorpayCheckoutPrefill = {
  email?: string
  name?: string
}

export type RazorpayCheckoutSuccessResponse = {
  razorpay_payment_id: string
  razorpay_subscription_id: string
  razorpay_signature: string
}

type RazorpayCheckoutOptions = {
  key: string
  subscription_id: string
  handler?: (response: RazorpayCheckoutSuccessResponse) => void
  name?: string
  description?: string
  prefill?: RazorpayCheckoutPrefill
  modal?: {
    ondismiss?: () => void
  }
}

type RazorpayCheckoutInstance = {
  open: () => void
  on: (event: string, handler: (response: unknown) => void) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance
  }
}

let checkoutScriptPromise: Promise<void> | null = null

function loadRazorpayCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay Checkout requires a browser environment."))
  }

  if (window.Razorpay) {
    return Promise.resolve()
  }

  if (checkoutScriptPromise) {
    return checkoutScriptPromise
  }

  checkoutScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CHECKOUT_SCRIPT_SRC}"]`
    )

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Razorpay Checkout.")),
        { once: true }
      )
      if (window.Razorpay) {
        resolve()
      }
      return
    }

    const script = document.createElement("script")
    script.src = CHECKOUT_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Razorpay Checkout."))
    document.body.appendChild(script)
  })

  return checkoutScriptPromise
}

function saveCheckoutDebugResponse(response: RazorpayCheckoutSuccessResponse): void {
  setJson(CHECKOUT_DEBUG_RESPONSE_KEY, {
    paymentId: response.razorpay_payment_id,
    subscriptionId: response.razorpay_subscription_id,
    signature: response.razorpay_signature,
    capturedAt: Date.now(),
  })
}

export type OpenRazorpaySubscriptionCheckoutInput = {
  keyId: string
  subscriptionId: string
  customerEmail?: string
  customerName?: string
  onDismiss?: () => void
  onSuccess?: (response: RazorpayCheckoutSuccessResponse) => void
}

export async function openRazorpaySubscriptionCheckout(
  input: OpenRazorpaySubscriptionCheckoutInput
): Promise<boolean> {
  try {
    await loadRazorpayCheckoutScript()

    if (!window.Razorpay) {
      return false
    }

    const checkout = new window.Razorpay({
      key: input.keyId,
      subscription_id: input.subscriptionId,
      name: "Convertly",
      description: "Subscription upgrade",
      prefill: {
        email: input.customerEmail,
        name: input.customerName,
      },
      handler: (response) => {
        saveCheckoutDebugResponse(response)
        input.onSuccess?.(response)
      },
      modal: {
        ondismiss: () => {
          input.onDismiss?.()
        },
      },
    })

    checkout.open()
    return true
  } catch {
    return false
  }
}
