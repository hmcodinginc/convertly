import type { PaidPlanId } from "../pricing/catalog.ts"

export type RazorpayEnvironment = "test" | "production"

const PRODUCTION_ENV_KEYS = {
  keyId: "RAZORPAY_KEY_ID",
  keySecret: "RAZORPAY_KEY_SECRET",
  webhookSecret: "RAZORPAY_WEBHOOK_SECRET",
  plans: {
    starter: "RAZORPAY_PLAN_STARTER",
    growth: "RAZORPAY_PLAN_GROWTH",
    scale: "RAZORPAY_PLAN_SCALE",
  },
} as const

const TEST_ENV_KEYS = {
  keyId: "RAZORPAY_TEST_KEY_ID",
  keySecret: "RAZORPAY_TEST_KEY_SECRET",
  webhookSecret: "RAZORPAY_TEST_WEBHOOK_SECRET",
  plans: {
    starter: "RAZORPAY_TEST_PLAN_STARTER",
    growth: "RAZORPAY_TEST_PLAN_GROWTH",
    scale: "RAZORPAY_TEST_PLAN_SCALE",
  },
} as const

/** Selects Razorpay credentials. Defaults to production when unset or any value other than "test". */
export function getRazorpayEnvironment(): RazorpayEnvironment {
  const configured = Deno.env.get("RAZORPAY_ENVIRONMENT")?.trim().toLowerCase()
  return configured === "test" ? "test" : "production"
}

function getActiveEnvKeys() {
  return getRazorpayEnvironment() === "test" ? TEST_ENV_KEYS : PRODUCTION_ENV_KEYS
}

function readRequiredEnv(envKey: string, label: string): string {
  const value = Deno.env.get(envKey)
  if (!value) {
    throw new Error(`${label} is not configured (${envKey}).`)
  }
  return value
}

export function getRazorpayKeyId(): string {
  const keys = getActiveEnvKeys()
  return readRequiredEnv(keys.keyId, "Razorpay key ID")
}

export function getRazorpayKeySecret(): string {
  const keys = getActiveEnvKeys()
  return readRequiredEnv(keys.keySecret, "Razorpay key secret")
}

export function getRazorpayWebhookSecret(): string {
  const keys = getActiveEnvKeys()
  return readRequiredEnv(keys.webhookSecret, "Razorpay webhook secret")
}

export function getRazorpayPlanEnvKeys(): Record<PaidPlanId, string> {
  const keys = getActiveEnvKeys()
  return { ...keys.plans }
}

export function readRazorpayPlanMappings(): Record<PaidPlanId, string | undefined> {
  const envKeys = getRazorpayPlanEnvKeys()
  return {
    starter: Deno.env.get(envKeys.starter),
    growth: Deno.env.get(envKeys.growth),
    scale: Deno.env.get(envKeys.scale),
  }
}
