import type { ReactNode } from "react"

import { Text } from "@/components/ui/typography/Text"
import { cn } from "@/lib/utils"

type AuthFormMessageProps = {
  variant?: "error" | "success"
  children: ReactNode
  className?: string
}

function AuthFormMessage({
  variant = "error",
  children,
  className,
}: AuthFormMessageProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "auth-form-message",
        variant === "error" ? "auth-form-message--error" : "auth-form-message--success",
        className
      )}
    >
      <Text size="sm" className="max-w-none leading-5">
        {children}
      </Text>
    </div>
  )
}

export { AuthFormMessage }
