export const MARKETING_NAV_ITEMS = [
  { label: "Features", sectionId: "features-title" },
  { label: "How it Works", sectionId: "how-it-works-title" },
  { label: "Pricing", sectionId: "cta-title" },
] as const

export type MarketingSectionId =
  | (typeof MARKETING_NAV_ITEMS)[number]["sectionId"]
  | "home-hero-title"
  | "social-proof-title"
  | "footer-brand"

type ScrollOptions = {
  behavior?: ScrollBehavior
}

function getScrollOffset(target: HTMLElement): number {
  const marginTop = parseFloat(getComputedStyle(target).scrollMarginTop)
  if (Number.isFinite(marginTop) && marginTop > 0) {
    return marginTop
  }

  const rootOffset = getComputedStyle(document.documentElement)
    .getPropertyValue("--marketing-nav-offset")
    .trim()

  if (!rootOffset) return 112

  const probe = document.createElement("div")
  probe.style.position = "absolute"
  probe.style.visibility = "hidden"
  probe.style.height = rootOffset
  document.body.appendChild(probe)
  const offset = probe.getBoundingClientRect().height
  probe.remove()

  return offset
}

export function scrollToMarketingSection(
  sectionId: MarketingSectionId | string,
  options: ScrollOptions = {}
): boolean {
  const target = document.getElementById(sectionId)
  if (!target) return false

  const offset = getScrollOffset(target)
  const top = window.scrollY + target.getBoundingClientRect().top - offset

  window.scrollTo({
    top: Math.max(0, top),
    behavior: options.behavior ?? "smooth",
  })

  clearMarketingHash()

  return true
}

export function clearMarketingHash(): void {
  const { pathname, search } = window.location
  const nextUrl = `${pathname}${search}`

  if (window.location.hash) {
    window.history.replaceState(null, "", nextUrl)
  }
}

export function isSupabaseAuthCallbackHash(): boolean {
  if (typeof window === "undefined") return false

  const hash = window.location.hash

  return (
    hash.includes("access_token=") ||
    hash.includes("type=signup") ||
    hash.includes("type=recovery") ||
    hash.includes("type=magiclink")
  )
}

export function handleMarketingHashOnLoad(): void {
  if (isSupabaseAuthCallbackHash()) return

  const sectionId = window.location.hash.replace(/^#/, "")
  if (!sectionId) return

  requestAnimationFrame(() => {
    scrollToMarketingSection(sectionId, { behavior: "auto" })
    clearMarketingHash()
  })
}
