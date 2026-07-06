import { getPaymentProviderId } from "./common.ts"
import { razorpayProvider } from "./providers/razorpay.ts"
import { stripeProvider } from "./providers/stripe.ts"
import type { PaymentProvider } from "./types.ts"

export function getPaymentProvider(): PaymentProvider {
  const providerId = getPaymentProviderId()

  switch (providerId) {
    case "razorpay":
      return razorpayProvider
    case "stripe":
      return stripeProvider
    default:
      throw new Error(`Unsupported payment provider: ${providerId}`)
  }
}

export { corsHeaders, jsonResponse } from "./common.ts"
export type { PaymentProvider } from "./types.ts"
