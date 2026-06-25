let lockCount = 0
let previousBodyOverflow = ""
let previousHtmlOverflow = ""
let previousPaddingRight = ""

function scrollbarWidth(): number {
  return window.innerWidth - document.documentElement.clientWidth
}

export function lockBodyScroll(): () => void {
  lockCount += 1

  if (lockCount === 1) {
    previousBodyOverflow = document.body.style.overflow
    previousHtmlOverflow = document.documentElement.style.overflow
    previousPaddingRight = document.body.style.paddingRight

    const gap = scrollbarWidth()
    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    if (gap > 0) {
      document.body.style.paddingRight = `${gap}px`
    }
  }

  return () => {
    lockCount = Math.max(0, lockCount - 1)

    if (lockCount === 0) {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
      document.body.style.paddingRight = previousPaddingRight
    }
  }
}

export function resetBodyScrollLock(): void {
  lockCount = 0
  document.documentElement.style.overflow = ""
  document.body.style.overflow = ""
  document.body.style.paddingRight = ""
}
