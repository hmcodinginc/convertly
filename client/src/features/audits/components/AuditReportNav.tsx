import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

export type AuditReportNavItem = {
  id: string
  label: string
}

type AuditReportNavProps = {
  items: AuditReportNavItem[]
  className?: string
}

function AuditReportNav({ items, className }: AuditReportNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "")

  useEffect(() => {
    if (items.length === 0) return

    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element != null)

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id)
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    )

    for (const section of sections) {
      observer.observe(section)
    }

    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  return (
    <nav
      className={cn("audit-report-nav", className)}
      aria-label="Report sections"
    >
      <div className="audit-report-nav__track">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              "audit-report-nav__link",
              activeId === item.id && "audit-report-nav__link--active"
            )}
            onClick={() => setActiveId(item.id)}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  )
}

export { AuditReportNav }
