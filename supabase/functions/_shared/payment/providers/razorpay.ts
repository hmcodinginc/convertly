import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

import type { PaidPlanId } from "../../pricing/catalog.ts"
import {
  mapToProviderPlanId,
  resolvePaidPlanFromSubscription,
} from "../../pricing/index.ts"
import {
  getRazorpayKeyId,
  getRazorpayKeySecret,
  getRazorpayWebhookSecret,
} from "../razorpayConfig.ts"
import {
  revertToFreePlan,
  syncSubscriptionRecord,
  syncSubscriptionScheduleOnly,
} from "../syncSubscription.ts"
import type {
  CancelContext,
  CheckoutContext,
  CheckoutResult,
  PaymentProvider,
  PortalContext,
  RazorpayPaymentProvider,
  RazorpayPlanChangeSchedule,
  RazorpayUpdateSubscriptionInput,
  RazorpayUpdateSubscriptionResult,
  VerifiedWebhook,
} from "../types.ts"

type RazorpaySubscription = {
  id?: string
  plan_id?: string
  customer_id?: string | null
  status?: string
  current_start?: number | null
  current_end?: number | null
  ended_at?: number | null
  notes?: Record<string, string>
  remaining_count?: number
  short_url?: string | null
  customer_notify?: boolean
  total_count?: number
  charge_at?: number | null
  expire_by?: number | null
  created_at?: number | null
  has_scheduled_changes?: boolean
  change_scheduled_at?: number | null
  schedule_change_at?: string | null
  payment_method?: string | null
  auth_attempts?: number | null
  paid_count?: number | null
  source?: string | null
  offer_id?: string | null
}

export type { RazorpayPlanChangeSchedule, RazorpayUpdateSubscriptionInput, RazorpayUpdateSubscriptionResult }

export class RazorpayApiError extends Error {
  readonly httpStatus: number
  readonly headers: Record<string, string>
  readonly rawBody: string
  readonly parsedBody: unknown

  constructor(details: {
    httpStatus: number
    headers: Record<string, string>
    rawBody: string
    parsedBody: unknown
  }) {
    super(`Razorpay API error (${details.httpStatus})`)
    this.name = "RazorpayApiError"
    this.httpStatus = details.httpStatus
    this.headers = details.headers
    this.rawBody = details.rawBody
    this.parsedBody = details.parsedBody
  }
}

type RazorpayEvent = {
  event: string
  payload: {
    subscription?: { entity: RazorpaySubscription }
    payment?: { entity: Record<string, unknown> }
  }
}

function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {}
  headers.forEach((value, key) => {
    result[key] = value
  })
  return result
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function countRazorpaySignatureHeaders(req: Request): number {
  let count = 0
  req.headers.forEach((_, name) => {
    if (name.toLowerCase() === "x-razorpay-signature") {
      count += 1
    }
  })
  return count
}

function getRazorpayAuthHeader(): string {
  const keyId = getRazorpayKeyId()
  const keySecret = getRazorpayKeySecret()
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

  const rawBody = await response.text()
  const parsedBody = tryParseJson(rawBody)
  const responseHeaders = headersToObject(response.headers)

  if (!response.ok) {
    if (init.method === "POST" && path === "/subscriptions") {
      console.error("[razorpay][subscription.create] failed", response.status)
    }

    throw new RazorpayApiError({
      httpStatus: response.status,
      headers: responseHeaders,
      rawBody,
      parsedBody,
    })
  }

  return parsedBody as T
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

async function computeRazorpayWebhookSignature(
  body: string,
  secret: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

async function verifyRazorpaySignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expected = await computeRazorpayWebhookSignature(body, secret)
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

/** Live entitlement plan — ignores notes.plan_id while a cycle_end change is scheduled. */
function readEntitlementPlanId(subscription: RazorpaySubscription): PaidPlanId | null {
  if (subscription.has_scheduled_changes && subscription.plan_id) {
    return resolvePaidPlanFromSubscription(undefined, subscription.plan_id, "razorpay")
  }
  return readNotes(subscription).planId
}

async function syncRazorpaySubscription(
  adminClient: SupabaseClient,
  subscription: RazorpaySubscription,
  options: { resetPeriodUsage?: boolean; clearScheduled?: boolean } = {}
): Promise<void> {
  const { workspaceId, userId } = readNotes(subscription)
  const planId = readEntitlementPlanId(subscription)

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
    status: mapRazorpayStatus(subscription.status ?? "active"),
    externalCustomerId: subscription.customer_id ?? null,
    externalSubscriptionId: subscription.id ?? null,
    externalPriceId: subscription.plan_id ?? null,
    currentPeriodStart: toIsoTimestamp(subscription.current_start),
    currentPeriodEnd: toIsoTimestamp(subscription.current_end),
    cancelAtPeriodEnd,
    resetPeriodUsage: options.resetPeriodUsage,
    paymentProvider: "razorpay",
    clearScheduled: options.clearScheduled,
  })
}

const UNSUPPORTED_PLAN_CHANGE_METHODS = new Set(["upi", "emandate", "nach"])

function assertPlanChangeSupported(subscription: RazorpaySubscription): void {
  const method = subscription.payment_method?.toLowerCase().trim()
  if (method && UNSUPPORTED_PLAN_CHANGE_METHODS.has(method)) {
    throw new Error(
      `Plan changes are not supported for ${method.toUpperCase()} subscriptions. Contact support or cancel and resubscribe on card.`
    )
  }
}

async function fetchRazorpaySubscription(
  externalSubscriptionId: string
): Promise<RazorpaySubscription> {
  return razorpayRequest<RazorpaySubscription>(`/subscriptions/${externalSubscriptionId}`)
}

const CONTINUABLE_CHECKOUT_STATUSES = new Set(["created", "authenticated", "pending"])

const TERMINAL_RAZORPAY_STATUSES = new Set(["cancelled", "completed", "expired"])

const LIVE_RAZORPAY_STATUSES = new Set(["active", "halted"])

export class CheckoutSubscriptionConflictError extends Error {
  readonly code = "USE_PLAN_CHANGE" as const

  constructor(message: string) {
    super(message)
    this.name = "CheckoutSubscriptionConflictError"
  }
}

async function fetchExistingRazorpaySubscription(
  externalSubscriptionId: string
): Promise<RazorpaySubscription | null> {
  try {
    return await fetchRazorpaySubscription(externalSubscriptionId)
  } catch (error) {
    if (error instanceof RazorpayApiError && error.httpStatus === 404) {
      return null
    }
    throw error
  }
}

async function createRazorpayCheckoutSubscription(
  requestPayload: Record<string, unknown>
): Promise<RazorpaySubscription> {
  return razorpayRequest<RazorpaySubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify(requestPayload),
  })
}

async function cancelRazorpaySubscriptionImmediately(
  externalSubscriptionId: string
): Promise<RazorpaySubscription> {
  return razorpayRequest<RazorpaySubscription>(
    `/subscriptions/${externalSubscriptionId}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({ cancel_at_cycle_end: false }),
    }
  )
}

function isTerminalRazorpayStatus(status: string | undefined): boolean {
  return TERMINAL_RAZORPAY_STATUSES.has((status ?? "").toLowerCase())
}

async function clearStaleCheckoutSubscriptionReference(
  context: CheckoutContext
): Promise<void> {
  await context.adminClient
    .from("subscriptions")
    .update({
      stripe_subscription_id: null,
      stripe_price_id: null,
    })
    .eq("id", context.workspace.subscriptionId)
}

async function persistCheckoutSubscriptionReference(
  context: CheckoutContext,
  subscription: RazorpaySubscription,
  providerPlanId: string
): Promise<void> {
  const { error: updateError } = await context.adminClient
    .from("subscriptions")
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: providerPlanId,
      payment_provider: "razorpay",
    })
    .eq("id", context.workspace.subscriptionId)

  if (updateError) {
    console.error(
      "[razorpay][checkout] database persist failed",
      context.workspace.workspaceId,
      subscription.id ?? null,
      updateError.message
    )
  }
}

async function resolveCheckoutSubscription(
  context: CheckoutContext,
  requestPayload: Record<string, unknown>
): Promise<RazorpaySubscription> {
  const existingId = context.workspace.subscription.stripe_subscription_id as string | null

  if (!existingId) {
    return createRazorpayCheckoutSubscription(requestPayload)
  }

  const existing = await fetchExistingRazorpaySubscription(existingId)

  if (!existing) {
    await clearStaleCheckoutSubscriptionReference(context)
    return createRazorpayCheckoutSubscription(requestPayload)
  }

  const status = (existing.status ?? "created").toLowerCase()

  if (LIVE_RAZORPAY_STATUSES.has(status)) {
    throw new CheckoutSubscriptionConflictError(
      "An active subscription already exists for this workspace. Use plan change instead of checkout."
    )
  }

  if (CONTINUABLE_CHECKOUT_STATUSES.has(status)) {
    if (existing.plan_id === context.providerPlanId) {
      return existing
    }

    await cancelRazorpaySubscriptionImmediately(existingId)
    const verified = await fetchRazorpaySubscription(existingId)

    if (!isTerminalRazorpayStatus(verified.status)) {
      throw new Error("Unable to replace unfinished subscription. Try again shortly.")
    }

    return createRazorpayCheckoutSubscription(requestPayload)
  }

  if (isTerminalRazorpayStatus(status)) {
    return createRazorpayCheckoutSubscription(requestPayload)
  }

  throw new Error(`Unable to start checkout for subscription in status: ${status}`)
}

async function updateRazorpaySubscription(
  input: RazorpayUpdateSubscriptionInput
): Promise<RazorpayUpdateSubscriptionResult> {
  const live = await fetchRazorpaySubscription(input.externalSubscriptionId)
  assertPlanChangeSupported(live)

  const scheduleChangeAt: RazorpayPlanChangeSchedule = "cycle_end"

  const patchPayload = {
    plan_id: input.providerPlanId,
    schedule_change_at: scheduleChangeAt,
    customer_notify: true,
  }

  let subscription: RazorpaySubscription
  try {
    subscription = await razorpayRequest<RazorpaySubscription>(
      `/subscriptions/${input.externalSubscriptionId}`,
      {
        method: "PATCH",
        body: JSON.stringify(patchPayload),
      }
    )
  } catch (error) {
    if (error instanceof RazorpayApiError) {
      console.error(
        "[razorpay][plan-change] PATCH failed",
        input.externalSubscriptionId,
        error.httpStatus
      )
    }
    throw error
  }

  return {
    subscription: subscription as unknown as Record<string, unknown>,
    scheduleChangeAt,
  }
}

async function fetchRazorpayPendingUpdate(
  externalSubscriptionId: string
): Promise<RazorpaySubscription> {
  return razorpayRequest<RazorpaySubscription>(
    `/subscriptions/${externalSubscriptionId}/retrieve_scheduled_changes`
  )
}

async function cancelRazorpayScheduledChanges(
  externalSubscriptionId: string
): Promise<RazorpaySubscription> {
  return razorpayRequest<RazorpaySubscription>(
    `/subscriptions/${externalSubscriptionId}/cancel_scheduled_changes`,
    { method: "POST", body: JSON.stringify({}) }
  )
}

async function handleSubscriptionUpdated(
  adminClient: SupabaseClient,
  subscription: RazorpaySubscription
): Promise<void> {
  const { workspaceId, userId } = readNotes(subscription)

  if (!workspaceId || !userId) {
    console.error("Missing notes on Razorpay subscription.updated", subscription.id)
    return
  }

  if (subscription.has_scheduled_changes) {
    let scheduledPlan = readNotes(subscription).planId

    try {
      const pending = await fetchRazorpayPendingUpdate(subscription.id!)
      const pendingNotes = pending.notes ?? {}
      scheduledPlan =
        resolvePaidPlanFromSubscription(
          pendingNotes.plan_id,
          pending.plan_id,
          "razorpay"
        ) ?? scheduledPlan
    } catch (error) {
      console.error("[razorpay][webhook] retrieve_scheduled_changes failed", {
        subscriptionId: subscription.id,
        error: error instanceof Error ? error.message : error,
      })
    }

    await syncSubscriptionScheduleOnly(adminClient, {
      workspaceId,
      userId,
      scheduledPlan,
      scheduledChangeAt: toIsoTimestamp(subscription.change_scheduled_at),
      currentPeriodEnd: toIsoTimestamp(subscription.current_end),
    })
    return
  }

  await syncRazorpaySubscription(adminClient, subscription, { clearScheduled: true })
}

export const razorpayProvider: RazorpayPaymentProvider = {
  id: "razorpay",

  async createCheckout(context: CheckoutContext): Promise<CheckoutResult> {
    const expireBy = Math.floor(Date.now() / 1000) + 60 * 60 * 24

    const requestPayload = {
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
    }

    const subscription = await resolveCheckoutSubscription(context, requestPayload)

    const shortUrl = subscription.short_url?.trim()
    if (!shortUrl) {
      console.error(
        "[razorpay][checkout] missing short_url",
        subscription.id ?? null,
        subscription.status ?? null
      )
      throw new Error("Unable to create Razorpay checkout link.")
    }

    await persistCheckoutSubscriptionReference(context, subscription, context.providerPlanId)

    return {
      url: shortUrl,
      subscriptionId: subscription.id,
      shortUrl,
      keyId: getRazorpayKeyId(),
    }
  },

  async getCustomerPortal(context: PortalContext): Promise<{ url: string }> {
    const externalSubscriptionId = context.workspace.subscription
      .stripe_subscription_id as string | null

    if (!externalSubscriptionId) {
      throw new Error("No active subscription found.")
    }

    const subscription = await razorpayRequest<RazorpaySubscription>(
      `/subscriptions/${externalSubscriptionId}`
    )

    const portalUrl = subscription.short_url?.trim()
    if (!portalUrl) {
      console.error("[razorpay][portal] missing short_url", externalSubscriptionId)
      throw new Error("Subscription management link is unavailable.")
    }

    return { url: portalUrl }
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
    const webhookSecret = getRazorpayWebhookSecret()
    const signatureHeaderCount = countRazorpaySignatureHeaders(req)

    if (signatureHeaderCount !== 1) {
      console.error("[razorpay][webhook] invalid signature header count", signatureHeaderCount)
      if (signatureHeaderCount === 0) {
        throw new Error("Missing x-razorpay-signature header.")
      }
      throw new Error("Invalid x-razorpay-signature header count.")
    }

    const signature = req.headers.get("x-razorpay-signature")
    if (!signature) {
      throw new Error("Missing x-razorpay-signature header.")
    }

    const rawBody = await req.text()
    const isValid = await verifyRazorpaySignature(rawBody, signature, webhookSecret)

    if (!isValid) {
      console.error("[razorpay][webhook] signature verification failed")
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
      case "subscription.activated": {
        if (subscription) {
          await syncRazorpaySubscription(adminClient, subscription)
        }
        break
      }
      case "subscription.updated": {
        if (subscription) {
          await handleSubscriptionUpdated(adminClient, subscription)
        }
        break
      }
      case "subscription.charged": {
        if (subscription) {
          await syncRazorpaySubscription(adminClient, subscription, {
            resetPeriodUsage: true,
            clearScheduled: !subscription.has_scheduled_changes,
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

  updateSubscription: updateRazorpaySubscription,
  fetchPendingUpdate: async (externalSubscriptionId: string) =>
    fetchRazorpayPendingUpdate(externalSubscriptionId) as unknown as Record<string, unknown>,
  cancelScheduledChanges: async (externalSubscriptionId: string) =>
    cancelRazorpayScheduledChanges(externalSubscriptionId) as unknown as Record<string, unknown>,
  fetchSubscription: async (externalSubscriptionId: string) =>
    fetchRazorpaySubscription(externalSubscriptionId) as unknown as Record<string, unknown>,
}
