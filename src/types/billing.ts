export type BillingPlanSummary = {
  name: string
  price: string
  interval: string
  renewalDate: string
  status: string
}

export type BillingUsageItem = {
  label: string
  value: string
  limit: string
}

export type BillingCredits = {
  remaining: number
  total: number
  resetsOn: string
}

export type BillingPlanOption = {
  id: string
  name: string
  price: string
  audits: number
  highlight: boolean
}

export type BillingSnapshot = {
  plan: BillingPlanSummary
  usage: BillingUsageItem[]
  credits: BillingCredits
  plans: BillingPlanOption[]
}
