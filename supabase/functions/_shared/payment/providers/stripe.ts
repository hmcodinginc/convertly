import Stripe from "https://esm.sh/stripe@17.7.0?target=deno"
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

import { getAppOrigin } from "../common.ts"
import {
  mapFromProviderPlanId,
  resolvePaidPlanFromSubscription,
} from "../../pricing/index.ts"
import {
  revertToFreePlan,
  syncSubscriptionRecord,
} from "../syncSubscription.ts"
import type {
  CancelContext,
  CheckoutContext,
  PaymentProvider,
  PortalContext,
  VerifiedWebhook,
} from "../types.ts"

function getStripeClient(): Stripe {
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY")
  if (!secretKey) {
    throw new Error("Stripe is not configured.")
  }

  return new Stripe(secretKey, {
    apiVersion: "2024-12-18.acacia",
    httpClient: Stripe.createFetchHttpClient(),
  })
}

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
      return "active"
    case "trialing":
      return "trialing"
    case "past_due":
      return "past_due"
    case "canceled":
      return "canceled"
    case "unpaid":
      return "unpaid"
    case "incomplete":
    case "incomplete_expired":
      return "incomplete"
    default:
      return "active"
  }
}

async function syncStripeSubscription(
  adminClient: SupabaseClient,
  stripeSubscription: Stripe.Subscription,
  options: { resetPeriodUsage?: boolean } = {}
): Promise<void> {
  const workspaceId = stripeSubscription.metadata.workspace_id
  const userId = stripeSubscription.metadata.user_id

  if (!workspaceId || !userId) {
    console.error("Missing metadata on Stripe subscription", stripeSubscription.id)
    return
  }

  const item = stripeSubscription.items.data[0]
  const priceId = item?.price?.id ?? null
  const metadataPlanId = stripeSubscription.metadata.plan_id
  const planId =
    resolvePaidPlanFromSubscription(metadataPlanId, priceId ?? "", "stripe") ??
    (priceId ? mapFromProviderPlanId(priceId, "stripe") : null)

  if (!planId || planId === "free") {
    console.error("Unable to resolve Convertly plan for Stripe subscription", stripeSubscription.id)
    return
  }

  await syncSubscriptionRecord(adminClient, {
    workspaceId,
    userId,
    planId,
    status: mapStripeStatus(stripeSubscription.status),
    externalCustomerId:
      typeof stripeSubscription.customer === "string"
        ? stripeSubscription.customer
        : stripeSubscription.customer.id,
    externalSubscriptionId: stripeSubscription.id,
    externalPriceId: priceId,
    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    resetPeriodUsage: options.resetPeriodUsage,
    paymentProvider: "stripe",
  })
}

export const stripeProvider: PaymentProvider = {
  id: "stripe",

  async createCheckout(context: CheckoutContext): Promise<{ url: string }> {
    const stripe = getStripeClient()
    let customerId = context.workspace.subscription.stripe_customer_id as string | null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: context.user.email ?? undefined,
        metadata: {
          user_id: context.user.id,
          workspace_id: context.workspace.workspaceId,
        },
      })
      customerId = customer.id

      await context.adminClient
        .from("subscriptions")
        .update({
          stripe_customer_id: customerId,
          payment_provider: "stripe",
        })
        .eq("id", context.workspace.subscriptionId)
    }

    const origin = getAppOrigin()

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: context.providerPlanId, quantity: 1 }],
      success_url: `${origin}/billing?checkout=success`,
      cancel_url: `${origin}/billing?checkout=canceled`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_update: { address: "auto", name: "auto" },
      metadata: {
        user_id: context.user.id,
        workspace_id: context.workspace.workspaceId,
        plan_id: context.planId,
      },
      subscription_data: {
        metadata: {
          user_id: context.user.id,
          workspace_id: context.workspace.workspaceId,
          plan_id: context.planId,
        },
      },
    })

    if (!session.url) {
      throw new Error("Unable to create checkout session.")
    }

    return { url: session.url }
  },

  async getCustomerPortal(context: PortalContext): Promise<{ url: string }> {
    const customerId = context.workspace.subscription.stripe_customer_id as string | null

    if (!customerId) {
      throw new Error("No payment customer found. Upgrade first.")
    }

    const stripe = getStripeClient()
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: context.returnUrl,
    })

    return { url: portalSession.url }
  },

  async cancelSubscription(context: CancelContext): Promise<void> {
    const externalSubscriptionId = context.workspace.subscription
      .stripe_subscription_id as string | null

    if (!externalSubscriptionId) {
      throw new Error("No active subscription found.")
    }

    const stripe = getStripeClient()

    if (context.cancelAtPeriodEnd) {
      await stripe.subscriptions.update(externalSubscriptionId, {
        cancel_at_period_end: true,
      })
      await context.adminClient
        .from("subscriptions")
        .update({ cancel_at_period_end: true })
        .eq("id", context.workspace.subscriptionId)
      return
    }

    await stripe.subscriptions.cancel(externalSubscriptionId)
    await revertToFreePlan(context.adminClient, context.workspace.workspaceId)
  },

  async verifyWebhook(req: Request): Promise<VerifiedWebhook> {
    const stripe = getStripeClient()
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")

    if (!webhookSecret) {
      throw new Error("Stripe webhook secret not configured.")
    }

    const signature = req.headers.get("stripe-signature")
    if (!signature) {
      throw new Error("Missing stripe-signature header.")
    }

    const rawBody = await req.text()
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)

    return {
      provider: "stripe",
      eventType: event.type,
      payload: event as unknown as Record<string, unknown>,
      rawBody,
    }
  },

  async handleWebhookEvent(
    adminClient: SupabaseClient,
    event: VerifiedWebhook
  ): Promise<void> {
    const stripe = getStripeClient()
    const stripeEvent = event.payload as unknown as Stripe.Event

    switch (stripeEvent.type) {
      case "checkout.session.completed": {
        const session = stripeEvent.data.object as Stripe.Checkout.Session
        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id
          const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
          await syncStripeSubscription(adminClient, stripeSubscription)
        }
        break
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const stripeSubscription = stripeEvent.data.object as Stripe.Subscription
        await syncStripeSubscription(adminClient, stripeSubscription)
        break
      }
      case "customer.subscription.deleted": {
        const stripeSubscription = stripeEvent.data.object as Stripe.Subscription
        const workspaceId = stripeSubscription.metadata.workspace_id
        if (workspaceId) {
          await revertToFreePlan(adminClient, workspaceId)
        }
        break
      }
      case "invoice.payment_succeeded": {
        const invoice = stripeEvent.data.object as Stripe.Invoice
        if (invoice.subscription) {
          const subscriptionId =
            typeof invoice.subscription === "string"
              ? invoice.subscription
              : invoice.subscription.id
          const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
          await syncStripeSubscription(adminClient, stripeSubscription, {
            resetPeriodUsage: true,
          })
        }
        break
      }
      default:
        break
    }
  },
}
