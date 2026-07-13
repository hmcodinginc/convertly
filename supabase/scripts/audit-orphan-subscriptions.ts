/**
 * Report-only audit: detect multiple Razorpay subscriptions per workspace.
 *
 * Usage (from repo root):
 *   deno run --allow-net --allow-env supabase/scripts/audit-orphan-subscriptions.ts
 *
 * Required env:
 *   SUPABASE_URL, SERVICE_ROLE_KEY
 *   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET  (or RAZORPAY_TEST_* when RAZORPAY_ENVIRONMENT=test)
 *
 * Does NOT cancel or modify any subscription.
 */

type DbSubscription = {
  workspace_id: string
  user_id: string
  plan: string
  status: string
  stripe_subscription_id: string | null
}

type RazorpaySubscription = {
  id: string
  status: string
  plan_id?: string
  notes?: Record<string, string>
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing env: ${name}`)
  return value
}

function getRazorpayCredentials(): { keyId: string; keySecret: string } {
  const environment = Deno.env.get("RAZORPAY_ENVIRONMENT") ?? "production"
  if (environment === "test") {
    return {
      keyId: requireEnv("RAZORPAY_TEST_KEY_ID"),
      keySecret: requireEnv("RAZORPAY_TEST_KEY_SECRET"),
    }
  }
  return {
    keyId: requireEnv("RAZORPAY_KEY_ID"),
    keySecret: requireEnv("RAZORPAY_KEY_SECRET"),
  }
}

async function fetchDbSubscriptions(
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<DbSubscription[]> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/subscriptions?select=workspace_id,user_id,plan,status,stripe_subscription_id&stripe_subscription_id=not.is.null`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Supabase query failed: ${response.status}`)
  }

  return (await response.json()) as DbSubscription[]
}

async function fetchAllRazorpaySubscriptions(
  keyId: string,
  keySecret: string
): Promise<RazorpaySubscription[]> {
  const auth = btoa(`${keyId}:${keySecret}`)
  const results: RazorpaySubscription[] = []
  let skip = 0
  const count = 100

  while (true) {
    const response = await fetch(
      `https://api.razorpay.com/v1/subscriptions?count=${count}&skip=${skip}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Razorpay list failed: ${response.status} ${await response.text()}`)
    }

    const payload = (await response.json()) as { items: RazorpaySubscription[]; count: number }
    results.push(...payload.items)

    if (payload.items.length < count) break
    skip += count
  }

  return results
}

const ACTIVE_RAZORPAY = new Set([
  "created",
  "authenticated",
  "active",
  "pending",
  "halted",
])

function mainReport(
  dbRows: DbSubscription[],
  razorpaySubs: RazorpaySubscription[]
): void {
  const canonicalByWorkspace = new Map<string, DbSubscription>()
  for (const row of dbRows) {
    canonicalByWorkspace.set(row.workspace_id, row)
  }

  const byWorkspace = new Map<string, RazorpaySubscription[]>()
  for (const sub of razorpaySubs) {
    const workspaceId = sub.notes?.workspace_id
    if (!workspaceId) continue
    const list = byWorkspace.get(workspaceId) ?? []
    list.push(sub)
    byWorkspace.set(workspaceId, list)
  }

  console.log("\n=== Convertly Orphan Subscription Audit (report only) ===\n")
  console.log(`DB subscriptions with external id: ${dbRows.length}`)
  console.log(`Razorpay subscriptions with workspace_id note: ${byWorkspace.size} workspaces\n`)

  let orphanCount = 0

  for (const [workspaceId, subs] of byWorkspace.entries()) {
    if (subs.length <= 1) continue

    const canonical = canonicalByWorkspace.get(workspaceId)
    const canonicalId = canonical?.stripe_subscription_id ?? null
    const activeSubs = subs.filter((s) => ACTIVE_RAZORPAY.has(s.status))

    console.log(`Workspace ${workspaceId}`)
    console.log(`  Canonical (DB): ${canonicalId ?? "none"}`)
    console.log(`  Razorpay count: ${subs.length} (${activeSubs.length} active-like)`)

    for (const sub of subs) {
      const role =
        sub.id === canonicalId
          ? "CANONICAL"
          : ACTIVE_RAZORPAY.has(sub.status)
            ? "ORPHAN_CANDIDATE"
            : "HISTORICAL"
      if (role === "ORPHAN_CANDIDATE") orphanCount += 1
      console.log(
        `    - ${sub.id} status=${sub.status} plan=${sub.plan_id ?? "?"} role=${role}`
      )
    }
    console.log("")
  }

  if (orphanCount === 0) {
    console.log("No orphan candidates detected.")
  } else {
    console.log(`Total orphan candidates: ${orphanCount}`)
    console.log("Review in Razorpay dashboard before any manual cancellation.")
  }
}

const supabaseUrl = requireEnv("SUPABASE_URL")
const serviceRoleKey = requireEnv("SERVICE_ROLE_KEY")
const { keyId, keySecret } = getRazorpayCredentials()

const dbRows = await fetchDbSubscriptions(supabaseUrl, serviceRoleKey)
const razorpaySubs = await fetchAllRazorpaySubscriptions(keyId, keySecret)
mainReport(dbRows, razorpaySubs)
