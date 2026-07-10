import { getAppOrigin } from "@/lib/authRedirects"
import { ROUTES } from "@/lib/routes"

/** Razorpay Standard Checkout callback after subscription authorisation payment. */
export function getBillingCheckoutReturnUrl(): string {
  return `${getAppOrigin()}${ROUTES.billingReturn}?checkout=success`
}
