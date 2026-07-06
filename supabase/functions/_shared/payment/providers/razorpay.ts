import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

import { getAppOrigin } from "../common.ts"
import { resolvePaidPlanFromSubscription } from "../../pricing/index.ts"
import type { PaidPlanId } from "../../pricing/catalog.ts"
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

type RazorpaySubscription = {
  id: string
  plan_id: string
  customer_id: string | null
  status: string
  current_start: number | null
  current_end: number | null
  ended_at: number | null
  notes?: Record<string, string>
  remaining_count?: number
  short_url?: string | null
}

type RazorpayEvent = {
  event: string
  payload: {
    subscription?: { entity: RazorpaySubscription }
    payment?: { entity: Record<string, unknown> }
  }
}

function getRazorpayAuthHeader(): string {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID")
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")

  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured.")
  }

  return `Basic ${btoa(`${keyId}:${keySecret}`)}`
}

async function razorpayRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: getRazorpayAuthHeader(),
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Razorpay request failed (${response.status}).`)
  }

  return (await response.json()) as T
}

function getSubscriptionTotalCount(): number {
  const configured = Deno.env.get("RAZORPAY_SUBSCRIPTION_TOTAL_COUNT")
  if (configured) {
    const parsed = Number.parseInt(configured, 10)
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed
    }
  }
  return 1200
}

function mapRazorpayStatus(status: string): string {
  switch (status) {
    case "active":
      return "active"
    case "authenticated":
    case "created":
      return "incomplete"
    case "pending":
    case "halted":
      return "past_due"
    case "cancelled":
    case "completed":
    case "expired":
      return "canceled"
    default:
      return "active"
  }
}

function toIsoTimestamp(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds) return null
  return new Date(unixSeconds * 1000).toISOString()
}

async function verifyRazorpaySignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))
  const expected = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")

  return expected === signature
}

function readNotes(subscription: RazorpaySubscription): {
  workspaceId: string | null
  userId: string | null
  planId: PaidPlanId | null
} {
  const notes = subscription.notes ?? {}
  const workspaceId = notes.workspace_id ?? null
  const userId = notes.user_id ?? null
  const planId = resolvePaidPlanFromSubscription(
    notes.plan_id,
    subscription.plan_id,
    "razorpay"
  )

  return { workspaceId, userId, planId }
}

async function syncRazorpaySubscription(
  adminClient: SupabaseClient,
  subscription: RazorpaySubscription,
  options: { resetPeriodUsage?: boolean } = {}
): Promise<void> {
  const { workspaceId, userId, planId } = readNotes(subscription)

  if (!workspaceId || !userId) {
    console.error("Missing notes on Razorpay subscription", subscription.id)
    return
  }

  if (!planId) {
    console.error("Unable to resolve Convertly plan for Razorpay subscription", subscription.id)
    return
  }

  const isCancelled = subscription.status === "cancelled"
  const cancelAtPeriodEnd =
    isCancelled && subscription.ended_at != null && subscription.current_end != null
      ? subscription.ended_at < subscription.current_end
      : false

  await syncSubscriptionRecord(adminClient, {
    workspaceId,
    userId,
    planId,
    status: mapRazorpayStatus(subscription.status),
    externalCustomerId: subscription.customer_id,
    externalSubscriptionId: subscription.id,
    externalPriceId: subscription.plan_id,
    currentPeriodStart: toIsoTimestamp(subscription.current_start),
    currentPeriodEnd: toIsoTimestamp(subscription.current_end),
    cancelAtPeriodEnd,
    resetPeriodUsage: options.resetPeriodUsage,
    paymentProvider: "razorpay",
  })
}

export const razorpayProvider: PaymentProvider = {
  id: "razorpay",

  async createCheckout(context: CheckoutContext): Promise<{ url: string }> {
    const origin = getAppOrigin()
    const expireBy = Math.floor(Date.now() / 1000) + 60 * 60 * 24

    const subscription = await razorpayRequest<RazorpaySubscription>("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        plan_id: context.providerPlanId,
        total_count: getSubscriptionTotalCount(),
        quantity: 1,
        customer_notify: true,
        expire_by: expireBy,
        notes: {
          user_id: context.user.id,
          workspace_id: context.workspace.workspaceId,
          plan_id: context.planId,
        },
      }),
    })

    if (!subscription.short_url) {
      throw new Error("Unable to create Razorpay checkout link.")
    }

    await context.adminClient
      .from("subscriptions")
      .update({
        stripe_subscription_id: subscription.id,
        stripe_price_id: context.providerPlanId,
        payment_provider: "razorpay",
      })
      .eq("id", context.workspace.subscriptionId)

    const successUrl = `${origin}/billing?checkout=success`
    const separator = subscription.short_url.includes("?") ? "&" : "?"
    return {
      url: `${subscription.short_url}${separator}redirect_url=${encodeURIComponent(successUrl)}`,
    }
  },

  async getCustomerPortal(context: PortalContext): Promise<{ url: string }> {
    // Razorpay has no Stripe-style customer portal. Return billing page for self-managed flow.
    const returnUrl = context.returnUrl.replace(/\/+$/, "")
    return {
      url: `${returnUrl}?portal=manage`,
    }
  },

  async cancelSubscription(context: CancelContext): Promise<void> {
    const externalSubscriptionId = context.workspace.subscription
      .stripe_subscription_id as string | null

    if (!externalSubscriptionId) {
      throw new Error("No active subscription found.")
    }

    const subscription = await razorpayRequest<RazorpaySubscription>(
      `/subscriptions/${externalSubscriptionId}/cancel`,
      {
        method: "POST",
        body: JSON.stringify({
          cancel_at_cycle_end: context.cancelAtPeriodEnd,
        }),
      }
    )

    await syncRazorpaySubscription(context.adminClient, subscription)

    if (!context.cancelAtPeriodEnd) {
      await revertToFreePlan(context.adminClient, context.workspace.workspaceId)
    } else {
      await context.adminClient
        .from("subscriptions")
        .update({ cancel_at_period_end: true })
        .eq("id", context.workspace.subscriptionId)
    }
  },

  async verifyWebhook(req: Request): Promise<VerifiedWebhook> {
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET")
    if (!webhookSecret) {
      throw new Error("Razorpay webhook secret not configured.")
    }

    const signature = req.headers.get("x-razorpay-signature")
    if (!signature) {
      throw new Error("Missing x-razorpay-signature header.")
    }

    const rawBody = await req.text()
    const isValid = await verifyRazorpaySignature(rawBody, signature, webhookSecret)

    if (!isValid) {
      throw new Error("Invalid Razorpay webhook signature.")
    }

    const payload = JSON.parse(rawBody) as RazorpayEvent

    return {
      provider: "razorpay",
      eventType: payload.event,
      payload: payload as unknown as Record<string, unknown>,
      rawBody,
    }
  },

  async handleWebhookEvent(
    adminClient: SupabaseClient,
    event: VerifiedWebhook
  ): Promise<void> {
    const payload = event.payload as unknown as RazorpayEvent
    const subscription = payload.payload.subscription?.entity

    switch (event.eventType) {
      case "subscription.authenticated":
      case "subscription.activated":
      case "subscription.updated": {
        if (subscription) {
          await syncRazorpaySubscription(adminClient, subscription)
        }
        break
      }
      case "subscription.charged": {
        if (subscription) {
          await syncRazorpaySubscription(adminClient, subscription, {
            resetPeriodUsage: true,
          })
        }
        break
      }
      case "subscription.cancelled":
      case "subscription.completed":
      case "subscription.expired": {
        if (subscription) {
          const { workspaceId } = readNotes(subscription)
          if (workspaceId) {
            await revertToFreePlan(adminClient, workspaceId)
          }
        }
        break
      }
      case "subscription.pending":
      case "subscription.halted": {
        if (subscription) {
          await syncRazorpaySubscription(adminClient, subscription)
        }
        break
      }
      default:
        break
    }
  },
}
