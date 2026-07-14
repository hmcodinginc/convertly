import { Link } from "react-router-dom"

import type { VertlyQuickAction } from "@/features/vertly/types"

type VertlyQuickActionsBarProps = {
  actions: VertlyQuickAction[]
  onClose: () => void
}

function VertlyQuickActionsBar({ actions, onClose }: VertlyQuickActionsBarProps) {
  if (actions.length === 0) return null

  return (
    <div className="vertly-quick-actions-bar">
      <p className="vertly-quick-actions-bar__heading">Quick Actions</p>
      <div className="vertly-quick-actions-bar__actions">
        {actions.map((action) => (
          <Link
            key={action.id}
            to={action.href}
            className="vertly-quick-action"
            onClick={onClose}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export { VertlyQuickActionsBar }
