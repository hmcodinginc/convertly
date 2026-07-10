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

export function getRazorpayCredentialEnvVarNames(): {
  keyId: string
  keySecret: string
} {
  const keys = getActiveEnvKeys()
  return {
    keyId: keys.keyId,
    keySecret: keys.keySecret,
  }
}

function readRequiredEnv(envKey: string, label: string): string {
  const value = Deno.env.get(envKey)
  if (!value) {
    throw new Error(`${label} is not configured (${envKey}).`)
  }
  return value
}

/** Masked for logs only — never log the secret. Example: rzp_test_********ABCD */
export function maskRazorpayKeyId(keyId: string): string {
  const lastFour = keyId.length >= 4 ? keyId.slice(-4) : "****"
  const testPrefix = keyId.match(/^(rzp_test_)/)
  if (testPrefix) {
    return `${testPrefix[1]}${"*".repeat(8)}${lastFour}`
  }
  const livePrefix = keyId.match(/^(rzp_live_)/)
  if (livePrefix) {
    return `${livePrefix[1]}${"*".repeat(8)}${lastFour}`
  }
  return `${"*".repeat(8)}${lastFour}`
}

/** Non-secret auth construction checks for diagnostics. Credentials are read fresh each call. */
export function inspectRazorpayAuthMaterial(keyId: string, keySecret: string) {
  const credentialString = `${keyId}:${keySecret}`
  let base64RoundTripValid = false

  try {
    const encoded = btoa(credentialString)
    base64RoundTripValid = encoded.length > 0 && encoded.startsWith("Basic ") === false
  } catch {
    base64RoundTripValid = false
  }

  return {
    credentialEnvVars: getRazorpayCredentialEnvVarNames(),
    keyIdLength: keyId.length,
    keySecretLength: keySecret.length,
    keyIdLeadingOrTrailingWhitespace: keyId !== keyId.trim(),
    keySecretLeadingOrTrailingWhitespace: keySecret !== keySecret.trim(),
    keyIdContainsNewline: /[\r\n]/.test(keyId),
    keySecretContainsNewline: /[\r\n]/.test(keySecret),
    joinUsesSingleColon: (credentialString.match(/:/g) ?? []).length === 1,
    authScheme: "Basic",
    base64RoundTripValid,
    credentialsCachedBetweenRequests: false,
  }
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

/** Diagnostic metadata for webhook secret selection — never logs secret values. */
export function inspectRazorpayWebhookSecret(): {
  environment: RazorpayEnvironment
  selectedSecretEnvVar: string
  productionSecretEnvVar: string
  testSecretEnvVar: string
  productionSecretExists: boolean
  testSecretExists: boolean
  selectedSecretLength: number
  selectedSecretIsEmpty: boolean
  selectedSecretHasLeadingOrTrailingWhitespace: boolean
  selectedSecretContainsNewline: boolean
} {
  const environment = getRazorpayEnvironment()
  const keys = getActiveEnvKeys()
  const productionRaw = Deno.env.get(PRODUCTION_ENV_KEYS.webhookSecret)
  const testRaw = Deno.env.get(TEST_ENV_KEYS.webhookSecret)
  const selectedRaw = Deno.env.get(keys.webhookSecret) ?? ""

  return {
    environment,
    selectedSecretEnvVar: keys.webhookSecret,
    productionSecretEnvVar: PRODUCTION_ENV_KEYS.webhookSecret,
    testSecretEnvVar: TEST_ENV_KEYS.webhookSecret,
    productionSecretExists: productionRaw != null && productionRaw.length > 0,
    testSecretExists: testRaw != null && testRaw.length > 0,
    selectedSecretLength: selectedRaw.length,
    selectedSecretIsEmpty: selectedRaw.length === 0,
    selectedSecretHasLeadingOrTrailingWhitespace:
      selectedRaw.length > 0 && selectedRaw !== selectedRaw.trim(),
    selectedSecretContainsNewline: /[\r\n]/.test(selectedRaw),
  }
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
