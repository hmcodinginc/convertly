import { useLayoutEffect } from "react"
import { useLocation } from "react-router-dom"

/**
 * BrowserRouter does not include React Router's data-router ScrollRestoration.
 * Reset window scroll on every pathname change so marketing → sample report
 * (and similar) never open mid-page.
 */
function ScrollToTop() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [pathname])

  return null
}

export { ScrollToTop }
