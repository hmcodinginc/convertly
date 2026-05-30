import * as React from "react"
import { Link, NavLink, type LinkProps, type NavLinkProps } from "react-router-dom"

import { ConvertlyMark } from "@/components/brand/ConvertlyMark"
import { MarketingNavLink } from "@/components/layout/MarketingNavLink"
import { cn } from "@/lib/utils"

/** Standard mark sizes — use everywhere for consistent branding */
const CONVERTLY_LOGO_MARK_SIZE = {
  sm: 20,
  md: 22,
} as const

const CONVERTLY_LOGO_WORDMARK_CLASS =
  "text-sm font-medium tracking-[0.12em] uppercase"

type ConvertlyLogoProps = React.HTMLAttributes<HTMLSpanElement> & {
  /** @default 22 */
  markSize?: number
}

function ConvertlyLogo({
  markSize = CONVERTLY_LOGO_MARK_SIZE.md,
  className,
  children,
  ...props
}: ConvertlyLogoProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-2.5 text-foreground/95", className)}
      {...props}
    >
      <ConvertlyMark size={markSize} />
      <span className={CONVERTLY_LOGO_WORDMARK_CLASS}>{children ?? "Convertly"}</span>
    </span>
  )
}

type ConvertlyLogoLinkProps = Omit<LinkProps, "children"> & {
  markSize?: number
}

function ConvertlyLogoLink({
  markSize = CONVERTLY_LOGO_MARK_SIZE.md,
  className,
  ...props
}: ConvertlyLogoLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex transition-colors duration-[var(--motion-fast)] hover:text-foreground",
        className
      )}
      {...props}
    >
      <ConvertlyLogo markSize={markSize} />
    </Link>
  )
}

type ConvertlyNavLogoLinkProps = NavLinkProps & {
  markSize?: number
}

function ConvertlyNavLogoLink({
  markSize = CONVERTLY_LOGO_MARK_SIZE.md,
  className,
  ...props
}: ConvertlyNavLogoLinkProps) {
  return (
    <NavLink
      className={cn(
        "inline-flex transition-colors duration-[var(--motion-fast)] hover:text-foreground",
        className
      )}
      {...props}
    >
      <ConvertlyLogo markSize={markSize} />
    </NavLink>
  )
}

type ConvertlyMarketingLogoLinkProps = React.ComponentProps<typeof MarketingNavLink> & {
  markSize?: number
}

function ConvertlyMarketingLogoLink({
  markSize = CONVERTLY_LOGO_MARK_SIZE.md,
  className,
  ...props
}: ConvertlyMarketingLogoLinkProps) {
  return (
    <MarketingNavLink
      className={cn(
        "inline-flex transition-colors duration-[var(--motion-fast)] hover:text-foreground",
        className
      )}
      {...props}
    >
      <ConvertlyLogo markSize={markSize} />
    </MarketingNavLink>
  )
}

export {
  CONVERTLY_LOGO_MARK_SIZE,
  CONVERTLY_LOGO_WORDMARK_CLASS,
  ConvertlyLogo,
  ConvertlyLogoLink,
  ConvertlyMarketingLogoLink,
  ConvertlyNavLogoLink,
}
