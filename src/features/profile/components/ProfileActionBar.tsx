import { KeyRound, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ProfileActionBarProps = {
  onEdit: () => void
  onChangePassword: () => void
  onDelete: () => void
}

function ProfileActionBar({ onEdit, onChangePassword, onDelete }: ProfileActionBarProps) {
  return (
    <div className="profile-action-bar">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="profile-action-btn"
        onClick={onEdit}
      >
        <Pencil className="size-4 shrink-0" aria-hidden />
        Edit Profile
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="profile-action-btn"
        onClick={onChangePassword}
      >
        <KeyRound className="size-4 shrink-0" aria-hidden />
        Change Password
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("profile-action-btn profile-delete-btn")}
        onClick={onDelete}
      >
        <Trash2 className="size-4 shrink-0" aria-hidden />
        Delete Account
      </Button>
    </div>
  )
}

export { ProfileActionBar }
