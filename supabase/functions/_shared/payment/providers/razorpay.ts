import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

import { resolvePaidPlanFromSubscription } from "../../pricing/index.ts"
import type { PaidPlanId } from "../../pricing/catalog.ts"
import {
  getRazorpayEnvironment,
  getRazorpayKeyId,
  getRazorpayKeySecret,
  getRazorpayWebhookSecret,
  inspectRazorpayAuthMaterial,
  inspectRazorpayWebhookSecret,
  maskRazorpayKeyId,
} from "../razorpayConfig.ts"
import {
  revertToFreePlan,
  syncSubscriptionRecord,
} from "../syncSubscription.ts"
import type {
  CancelContext,
  CheckoutContext,
  CheckoutResult,
  PaymentProvider,
  PortalContext,
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
}

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

const WEBHOOK_SENSITIVE_HEADER_NAMES = new Set([
  "authorization",
  "apikey",
  "x-api-key",
  "cookie",
  "set-cookie",
])

function collectIncomingWebhookHeaders(req: Request): {
  loggedHeaders: Record<string, string>
  razorpayHeaders: Record<string, string>
  signatureHeaderCount: number
  signatureHeaderPresentExactlyOnce: boolean
  contentType: string | null
  userAgent: string | null
  razorpayEventId: string | null
} {
  const loggedHeaders: Record<string, string> = {}
  const razorpayHeaders: Record<string, string> = {}
  let signatureHeaderCount = 0

  req.headers.forEach((value, name) => {
    const lower = name.toLowerCase()

    if (lower === "x-razorpay-signature") {
      signatureHeaderCount += 1
    }

    if (lower.startsWith("x-razorpay-")) {
      razorpayHeaders[name] =
        lower === "x-razorpay-signature" ? `[present,length=${value.length}]` : value
    }

    if (WEBHOOK_SENSITIVE_HEADER_NAMES.has(lower)) {
      loggedHeaders[name] = "[redacted]"
      return
    }

    if (
      lower === "content-type" ||
      lower === "user-agent" ||
      lower === "host" ||
      lower === "content-length" ||
      lower === "x-forwarded-for" ||
      lower === "x-real-ip" ||
      lower === "cf-connecting-ip" ||
      lower === "fly-client-ip"
    ) {
      loggedHeaders[name] = value
    }
  })

  return {
    loggedHeaders,
    razorpayHeaders,
    signatureHeaderCount,
    signatureHeaderPresentExactlyOnce: signatureHeaderCount === 1,
    contentType: req.headers.get("content-type"),
    userAgent: req.headers.get("user-agent"),
    razorpayEventId: req.headers.get("x-razorpay-event-id"),
  }
}

function tryParseRazorpayEventName(rawBody: string): string | null {
  const parsed = tryParseJson(rawBody)
  if (typeof parsed === "object" && parsed !== null && "event" in parsed) {
    const eventName = (parsed as { event: unknown }).event
    return typeof eventName === "string" ? eventName : null
  }
  return null
}

function getRazorpayAuthHeader(): string {
  const keyId = getRazorpayKeyId()
  const keySecret = getRazorpayKeySecret()
  return `Basic ${btoa(`${keyId}:${keySecret}`)}`
}

function logPreSubscriptionRequest(
  path: string,
  method: string,
  providerPlanId: string | null
): void {
  const keyId = getRazorpayKeyId()
  const keySecret = getRazorpayKeySecret()

  console.log("[razorpay][auth] pre-request", {
    environment: getRazorpayEnvironment(),
    maskedKeyId: maskRazorpayKeyId(keyId),
    providerPlanId,
    apiEndpoint: `https://api.razorpay.com/v1${path}`,
    method,
    authConstruction: inspectRazorpayAuthMaterial(keyId, keySecret),
  })
}

function logSubscriptionCreateResponseBody(
  httpStatus: number,
  parsedBody: unknown,
  rawBody: string
): void {
  console.log("[razorpay][subscription.create] response body", {
    httpStatus,
    parsedJson: parsedBody,
    rawBody,
  })
}

const SUBSCRIPTION_RESPONSE_FIELDS = [
  "id",
  "short_url",
  "plan_id",
  "status",
  "customer_notify",
  "remaining_count",
  "total_count",
  "current_start",
  "current_end",
  "charge_at",
  "expire_by",
  "created_at",
] as const

function logSubscriptionCreateFieldAudit(subscription: RazorpaySubscription): void {
  const fieldValues: Record<string, unknown> = {}

  for (const field of SUBSCRIPTION_RESPONSE_FIELDS) {
    const value = subscription[field]
    fieldValues[field] = value ?? null

    if (value === undefined || value === null) {
      console.warn(`[razorpay][subscription.create] missing field: ${field}`)
    }
  }

  console.log("[razorpay][subscription.create] field audit", fieldValues)
}

async function razorpayRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const method = init.method ?? "GET"
  const isSubscriptionCreate = method === "POST" && path === "/subscriptions"
  const requestPayload =
    isSubscriptionCreate && typeof init.body === "string"
      ? tryParseJson(init.body)
      : null

  if (isSubscriptionCreate) {
    const providerPlanId =
      requestPayload && typeof requestPayload === "object" && "plan_id" in requestPayload
        ? (requestPayload as { plan_id: string }).plan_id
        : null
    logPreSubscriptionRequest(path, method, providerPlanId)
  }

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

  if (isSubscriptionCreate) {
    logSubscriptionCreateResponseBody(response.status, parsedBody, rawBody)
  }

  if (!response.ok) {
    if (isSubscriptionCreate) {
      console.error("[razorpay][subscription.create] error response", {
        httpStatus: response.status,
        headers: responseHeaders,
        rawBody,
        parsedJson: parsedBody,
        errorObject:
          typeof parsedBody === "object" && parsedBody !== null && "error" in parsedBody
            ? (parsedBody as { error: unknown }).error
            : parsedBody,
      })
    }

    throw new RazorpayApiError({
      httpStatus: response.status,
      headers: responseHeaders,
      rawBody,
      parsedBody,
    })
  }

  const result = parsedBody as T

  if (isSubscriptionCreate) {
    logSubscriptionCreateFieldAudit(result as RazorpaySubscription)
  }

  return result
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

    console.log("[razorpay][checkout] createCheckout start", {
      environment: getRazorpayEnvironment(),
      convertlyPlanId: context.planId,
      providerPlanId: context.providerPlanId,
      workspaceId: context.workspace.workspaceId,
      userId: context.user.id,
      subscriptionId: context.workspace.subscriptionId,
      requestPayload,
    })

    const subscription = await razorpayRequest<RazorpaySubscription>("/subscriptions", {
      method: "POST",
      body: JSON.stringify(requestPayload),
    })

    if (!subscription.short_url) {
      console.error("[razorpay][checkout] missing short_url on Razorpay response", {
        subscriptionId: subscription.id ?? null,
        status: subscription.status ?? null,
        plan_id: subscription.plan_id ?? null,
        response: subscription,
      })
      throw new Error("Unable to create Razorpay checkout link.")
    }

    console.log("[razorpay][checkout] createCheckout returned", {
      url: subscription.short_url ?? null,
      subscriptionId: subscription.id ?? null,
      status: subscription.status ?? null,
      plan_id: subscription.plan_id ?? null,
      fullRazorpayResponse: subscription,
    })

    const { error: updateError } = await context.adminClient
      .from("subscriptions")
      .update({
        stripe_subscription_id: subscription.id,
        stripe_price_id: context.providerPlanId,
        payment_provider: "razorpay",
      })
      .eq("id", context.workspace.subscriptionId)

    if (updateError) {
      console.error("[razorpay][checkout] database persist failed", {
        workspaceId: context.workspace.workspaceId,
        externalSubscriptionId: subscription.id ?? null,
        provider: "razorpay",
        planId: context.providerPlanId,
        convertlyPlanId: context.planId,
        workspaceSubscriptionId: context.workspace.subscriptionId,
        success: false,
        error: updateError,
      })
    } else {
      console.log("[razorpay][checkout] database persist succeeded", {
        workspaceId: context.workspace.workspaceId,
        externalSubscriptionId: subscription.id ?? null,
        provider: "razorpay",
        planId: context.providerPlanId,
        convertlyPlanId: context.planId,
        workspaceSubscriptionId: context.workspace.subscriptionId,
        success: true,
      })
    }

    return {
      url: subscription.short_url,
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url,
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
      console.error("[razorpay][portal] missing short_url on subscription", {
        externalSubscriptionId,
        status: subscription.status ?? null,
      })
      throw new Error("Subscription management link is unavailable.")
    }

    console.log("[razorpay][portal] returning Razorpay management URL", {
      externalSubscriptionId,
      status: subscription.status ?? null,
    })

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
    const webhookSecretDiagnostics = inspectRazorpayWebhookSecret()
    const incomingHeaders = collectIncomingWebhookHeaders(req)

    console.log("[razorpay][webhook] incoming request headers", {
      webhookSecretDiagnostics,
      ...incomingHeaders,
      requestOriginNote:
        "Supabase Edge receives proxied requests; use user-agent and x-razorpay-* headers to assess Razorpay origin.",
    })

    if (!incomingHeaders.signatureHeaderPresentExactlyOnce) {
      console.error("[razorpay][webhook] invalid signature header cardinality", {
        signatureHeaderCount: incomingHeaders.signatureHeaderCount,
        expected: 1,
      })

      if (incomingHeaders.signatureHeaderCount === 0) {
        throw new Error("Missing x-razorpay-signature header.")
      }

      throw new Error("Invalid x-razorpay-signature header count.")
    }

    const signature = req.headers.get("x-razorpay-signature")
    if (!signature) {
      throw new Error("Missing x-razorpay-signature header.")
    }

    const rawBody = await req.text()
    const eventNameFromRawBody = tryParseRazorpayEventName(rawBody)

    console.log("[razorpay][webhook] raw body captured before JSON parse", {
      rawBodyLength: rawBody.length,
      rawBodyIsEmpty: rawBody.length === 0,
      eventNameFromRawBody,
      xRazorpayEventId: incomingHeaders.razorpayEventId,
    })

    const isValid = await verifyRazorpaySignature(rawBody, signature, webhookSecret)

    if (!isValid) {
      const trimmedSecretValid = await verifyRazorpaySignature(
        rawBody,
        signature,
        webhookSecret.trim()
      )

      console.error("[razorpay][webhook] signature verification failed", {
        webhookSecretDiagnostics,
        ...incomingHeaders,
        signatureLength: signature.length,
        rawBodyLength: rawBody.length,
        eventNameFromRawBody,
        hmacAlgorithm: "HMAC-SHA256",
        digestEncoding: "hex",
        matchesWithTrimmedSecret: trimmedSecretValid,
      })

      throw new Error("Invalid Razorpay webhook signature.")
    }

    const payload = JSON.parse(rawBody) as RazorpayEvent

    console.log("[razorpay][webhook] signature verified", {
      eventName: payload.event,
      xRazorpayEventId: incomingHeaders.razorpayEventId,
      signatureHeaderPresentExactlyOnce: incomingHeaders.signatureHeaderPresentExactlyOnce,
    })

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
