export type PaymentProviderId = "razorpay" | "stripe"

export type PaymentCheckoutParams = {
  planId: string
}

export type PaymentPortalParams = {
  returnUrl: string
}

export type PaymentCancelParams = {
  cancelAtPeriodEnd?: boolean
}

/**
 * Client-side contract mirroring the server payment provider surface.
 * Execution is delegated to Supabase edge functions; provider selection is server-side.
 */
export interface PaymentProviderClient {
  createCheckout(params: PaymentCheckoutParams): Promise<{ url: string }>
  getCustomerPortal(params: PaymentPortalParams): Promise<{ url: string }>
  cancelSubscription(params?: PaymentCancelParams): Promise<void>
}

export {
  invokeCancelSubscription,
  invokeCheckout,
  invokePortal,
} from "./paymentClient"
