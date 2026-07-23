import { cn } from "@/lib/utils"

type UserAvatarProps = {
  initials: string
  avatarUrl?: string | null
  size?: "sm" | "md" | "lg"
  className?: string
  alt?: string
}

const sizeClass = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
} as const

function UserAvatar({
  initials,
  avatarUrl,
  size = "sm",
  className,
  alt = "Profile photo",
}: UserAvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={alt}
        className={cn(
          "shrink-0 rounded-full object-cover shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
          sizeClass[size],
          className
        )}
      />
    )
  }

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7c6cff_0%,#5d7dff_52%,#35b3ff_100%)] font-semibold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
        sizeClass[size],
        className
      )}
    >
      {initials}
    </span>
  )
}

export { UserAvatar }
