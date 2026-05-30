import type * as React from "react"

import {
  scrollToMarketingSection,
  type MarketingSectionId,
} from "@/lib/marketingNavigation"

type MarketingNavLinkProps = React.ComponentProps<"a"> & {
  sectionId: MarketingSectionId | string
}

function MarketingNavLink({
  sectionId,
  href = "/",
  onClick,
  ...props
}: MarketingNavLinkProps) {
  return (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault()
        scrollToMarketingSection(sectionId)
        onClick?.(event)
      }}
      {...props}
    />
  )
}

export { MarketingNavLink }
