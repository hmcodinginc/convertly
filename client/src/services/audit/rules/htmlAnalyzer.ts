const CTA_SELECTORS = [
  "a[class*='btn']",
  "a[class*='button']",
  "a[class*='cta']",
  "button",
  "input[type='submit']",
  "[role='button']",
].join(", ")

const WEAK_CTA_PHRASES = [
  "click here",
  "submit",
  "learn more",
  "read more",
  "continue",
  "go",
]

const GENERIC_HEADLINES = [
  "welcome",
  "home",
  "homepage",
  "hello",
  "website",
  "landing page",
  "our site",
]

const VALUE_PROP_KEYWORDS = [
  "grow",
  "convert",
  "increase",
  "save",
  "faster",
  "easier",
  "revenue",
  "customers",
  "results",
  "solution",
  "platform",
  "automate",
  "boost",
  "improve",
  "scale",
]

const URGENCY_KEYWORDS = [
  "limited",
  "today",
  "now",
  "hurry",
  "last chance",
  "ends",
  "only",
  "spots left",
  "deadline",
  "exclusive",
]

const TESTIMONIAL_KEYWORDS = [
  "testimonial",
  "review",
  "what our customers",
  "what clients say",
  "customer stories",
  "rated",
  "stars",
]

const SOCIAL_PROOF_KEYWORDS = [
  "trusted by",
  "used by",
  "customers",
  "companies",
  "logos",
  "partners",
  "as seen",
  "join",
  "teams at",
]

export function getHeroRoot(document: Document): Element {
  return (
    document.querySelector("[class*='hero' i]") ??
    document.querySelector("main section") ??
    document.querySelector("main > div") ??
    document.querySelector("header + main") ??
    document.querySelector("section") ??
    document.body
  )
}

export function getCtaElements(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll(CTA_SELECTORS)).filter(
    (element): element is HTMLElement => element instanceof HTMLElement
  )
}

export function getVisibleText(element: Element | null): string {
  if (!element) return ""
  return (element.textContent ?? "").replace(/\s+/g, " ").trim()
}

export function getPrimaryHeadline(document: Document): string {
  return getVisibleText(document.querySelector("h1"))
}

export function getHeroValueText(document: Document): string {
  const hero = getHeroRoot(document)
  const headline = getPrimaryHeadline(document)
  const subcopy = getVisibleText(
    hero.querySelector("h2, p, [class*='subtitle' i], [class*='description' i]")
  )
  return `${headline} ${subcopy}`.toLowerCase()
}

export function isGenericHeadline(headline: string): boolean {
  const normalized = headline.toLowerCase().trim()
  if (!normalized || normalized.length < 4) return true
  if (normalized.split(/\s+/).length <= 2 && GENERIC_HEADLINES.includes(normalized)) {
    return true
  }
  return GENERIC_HEADLINES.some(
    (phrase) => normalized === phrase || normalized.startsWith(`${phrase} `)
  )
}

export function hasValueProposition(text: string): boolean {
  return VALUE_PROP_KEYWORDS.some((keyword) => text.includes(keyword))
}

export function countHeroCtas(document: Document): number {
  const hero = getHeroRoot(document)
  return getCtaElements(hero).filter((element) => getVisibleText(element).length > 0).length
}

export function hasPrimaryCta(document: Document): boolean {
  return countHeroCtas(document) > 0
}

export function hasCtaBelowFold(document: Document): boolean {
  const hero = getHeroRoot(document)
  const ctas = getCtaElements(document)
  const heroCtas = getCtaElements(hero)

  if (heroCtas.length === 0 && ctas.length > 0) return true

  const heroTextLength = getVisibleText(hero).length
  return heroCtas.length === 0 && heroTextLength > 600
}

export function hasLeadCaptureForm(document: Document): boolean {
  return Boolean(
    document.querySelector(
      "form input[type='email'], form input[name*='email' i], form textarea"
    )
  )
}

export function hasContactForm(document: Document): boolean {
  return Boolean(
    document.querySelector(
      "form input[type='email'], form textarea, form input[name*='message' i]"
    )
  )
}

export function hasWeakCtaLanguage(document: Document): boolean {
  const ctas = getCtaElements(document)
  return ctas.some((cta) => {
    const text = getVisibleText(cta).toLowerCase()
    return WEAK_CTA_PHRASES.some((phrase) => text === phrase || text.startsWith(`${phrase} `))
  })
}

export function getWeakCtaTexts(document: Document): string[] {
  const ctas = getCtaElements(document)
  return ctas
    .map((cta) => getVisibleText(cta))
    .filter((text) => {
      const normalized = text.toLowerCase()
      return WEAK_CTA_PHRASES.some(
        (phrase) => normalized === phrase || normalized.startsWith(`${phrase} `)
      )
    })
    .slice(0, 3)
}

export function getHeroCtaTexts(document: Document): string[] {
  const hero = getHeroRoot(document)
  return getCtaElements(hero)
    .map((element) => getVisibleText(element))
    .filter(Boolean)
    .slice(0, 3)
}

export function countNavigationLinks(document: Document): number {
  const nav = document.querySelector("nav, header")
  if (!nav) return 0
  return nav.querySelectorAll("a[href]").length
}

export function hasUrgencyIndicators(document: Document): boolean {
  const text = getVisibleText(document.body).toLowerCase()
  return URGENCY_KEYWORDS.some((keyword) => text.includes(keyword))
}

export function hasTestimonials(document: Document): boolean {
  const text = getVisibleText(document.body).toLowerCase()
  return TESTIMONIAL_KEYWORDS.some((keyword) => text.includes(keyword))
}

export function hasSocialProof(document: Document): boolean {
  const text = getVisibleText(document.body).toLowerCase()
  const hasLogoStrip = Boolean(
    document.querySelector(
      "[class*='logo' i], [class*='customer' i], [class*='trusted' i], [class*='client' i]"
    )
  )
  return hasLogoStrip || SOCIAL_PROOF_KEYWORDS.some((keyword) => text.includes(keyword))
}

export function hasViewportMeta(document: Document): boolean {
  return Boolean(document.querySelector("meta[name='viewport' i]"))
}

export function hasSmallTouchTargets(document: Document): boolean {
  const interactive = Array.from(
    document.querySelectorAll("a, button, input[type='submit'], [role='button']")
  )

  return interactive.some((element) => {
    if (!(element instanceof HTMLElement)) return false
    const style = element.getAttribute("style") ?? ""
    const heightMatch = style.match(/height:\s*(\d+)px/i)
    const widthMatch = style.match(/width:\s*(\d+)px/i)
    const height = heightMatch ? Number(heightMatch[1]) : 0
    const width = widthMatch ? Number(widthMatch[1]) : 0
    return (height > 0 && height < 44) || (width > 0 && width < 44)
  })
}

export function hasHorizontalOverflowRisk(document: Document): boolean {
  const html = document.documentElement.outerHTML.toLowerCase()
  return (
    html.includes("overflow-x: scroll") ||
    html.includes("overflow-x: auto") ||
    html.includes("overflow-x:scroll") ||
    html.includes("width: 100vw") ||
    html.includes("min-width: 100vw")
  )
}

export function hasSmallFontSizes(document: Document): boolean {
  const styled = Array.from(document.querySelectorAll("[style*='font-size']"))
  return styled.some((element) => {
    const style = element.getAttribute("style") ?? ""
    const match = style.match(/font-size:\s*(\d+(?:\.\d+)?)px/i)
    if (!match) return false
    return Number(match[1]) < 14
  })
}

export function hasOversizedImages(document: Document): boolean {
  return Array.from(document.querySelectorAll("img")).some((img) => {
    const width = Number(img.getAttribute("width") ?? 0)
    const hasMaxWidth = (img.getAttribute("style") ?? "").includes("max-width")
    return width > 500 && !hasMaxWidth
  })
}
