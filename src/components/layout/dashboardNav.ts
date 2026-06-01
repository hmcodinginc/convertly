import {
  Building2,
  CreditCard,
  History,
  LayoutDashboard,
  PlusCircle,
  Settings,
} from "lucide-react"

import { ROUTES } from "@/lib/routes"

const primaryNavItems = [
  {
    label: "Dashboard",
    to: ROUTES.dashboard,
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "New Audit",
    to: ROUTES.auditNew,
    icon: PlusCircle,
    end: false,
  },
  {
    label: "Audit History",
    to: ROUTES.audits,
    icon: History,
    end: false,
  },
] as const

const secondaryNavItems = [
  {
    label: "Workspace",
    to: ROUTES.workspace,
    icon: Building2,
    end: false,
  },
  {
    label: "Billing",
    to: ROUTES.billing,
    icon: CreditCard,
    end: false,
  },
  {
    label: "Settings",
    to: ROUTES.settings,
    icon: Settings,
    end: false,
  },
] as const

export { primaryNavItems, secondaryNavItems }
