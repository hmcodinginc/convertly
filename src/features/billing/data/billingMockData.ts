export const billingPlan = {
  name: "Growth",
  price: "$149",
  interval: "per month",
  renewalDate: "June 15, 2026",
  status: "Active",
}

export const billingUsage = [
  { label: "Audits run", value: "12", limit: "20" },
  { label: "Pages scanned", value: "1,842", limit: "4,000" },
  { label: "Team seats", value: "3", limit: "5" },
  { label: "AI recommendations", value: "48", limit: "Unlimited" },
]

export const billingCredits = {
  remaining: 8,
  total: 20,
  resetsOn: "July 1, 2026",
}

export const billingPlans = [
  {
    id: "starter",
    name: "Starter",
    price: "$49",
    audits: 5,
    highlight: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: "$149",
    audits: 20,
    highlight: true,
  },
  {
    id: "scale",
    name: "Scale",
    price: "$399",
    audits: 60,
    highlight: false,
  },
]
