import {
  billingCredits,
  billingPlan,
  billingPlans,
  billingUsage,
} from "@/features/billing/data/billingMockData"
import { delay } from "@/services/internal/delay"
import type { BillingSnapshot } from "@/types/billing"

export async function getBilling(): Promise<BillingSnapshot> {
  await delay()
  return {
    plan: billingPlan,
    usage: billingUsage,
    credits: billingCredits,
    plans: billingPlans,
  }
}
