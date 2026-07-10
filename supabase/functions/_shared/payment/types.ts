import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

import type {
  AuthenticatedUser,
  PaymentProviderId,
  WorkspaceContext,
} from "./common.ts"
import type { PaidPlanId } from "../pricing/catalog.ts"

export type CheckoutContext = {
  user: AuthenticatedUser
  workspace: WorkspaceContext
  planId: PaidPlanId
  providerPlanId: string
  adminClient: SupabaseClient
}

export type PortalContext = {
  user: AuthenticatedUser
  workspace: WorkspaceContext
  returnUrl: string
  adminClient: SupabaseClient
}

export type CancelContext = {
  user: AuthenticatedUser
  workspace: WorkspaceContext
  cancelAtPeriodEnd: boolean
  adminClient: SupabaseClient
}

export type VerifiedWebhook = {
  provider: PaymentProviderId
  eventType: string
  payload: Record<string, unknown>
  rawBody: string
}

export type CheckoutResult = {
  /** Provider checkout URL (Stripe) or legacy alias for Razorpay short_url */
  url?: string
  subscriptionId?: string
  shortUrl?: string
  keyId?: string
}

export interface PaymentProvider {
  readonly id: PaymentProviderId

  createCheckout(context: CheckoutContext): Promise<CheckoutResult>

  getCustomerPortal(context: PortalContext): Promise<{ url: string }>

  cancelSubscription(context: CancelContext): Promise<void>

  verifyWebhook(req: Request): Promise<VerifiedWebhook>

  handleWebhookEvent(adminClient: SupabaseClient, event: VerifiedWebhook): Promise<void>
}
