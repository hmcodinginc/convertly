import { Outlet } from "react-router-dom"

import { VertlyRoot } from "@/features/vertly/components/VertlyRoot"

function MarketingLayout() {
  return (
    <VertlyRoot variant="marketing">
      <Outlet />
    </VertlyRoot>
  )
}

export { MarketingLayout }
