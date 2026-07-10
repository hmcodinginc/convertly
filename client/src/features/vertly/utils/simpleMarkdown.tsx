import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"

type VertlyMarkdownProps = {
  content: string
  className?: string
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={`${match.index}-strong`}>{token.slice(2, -2)}</strong>
      )
    } else {
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(token)
      if (linkMatch) {
        const [, label, href] = linkMatch
        if (href.startsWith("/")) {
          nodes.push(
            <Link key={`${match.index}-link`} to={href} className="vertly-md-link">
              {label}
            </Link>
          )
        } else {
          nodes.push(
            <a
              key={`${match.index}-link`}
              href={href}
              className="vertly-md-link"
              target="_blank"
              rel="noreferrer"
            >
              {label}
            </a>
          )
        }
      }
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

function VertlyMarkdown({ content, className }: VertlyMarkdownProps) {
  const blocks = content.split(/\n{2,}/)

  return (
    <div className={cn("vertly-md", className)}>
      {blocks.map((block, index) => {
        const trimmed = block.trim()
        if (!trimmed) return null

        if (trimmed.startsWith("```")) {
          const code = trimmed.replace(/^```[^\n]*\n?/, "").replace(/```$/, "")
          return (
            <pre key={index} className="vertly-md__code">
              <code>{code}</code>
            </pre>
          )
        }

        return (
          <p key={index} className="vertly-md__paragraph">
            {trimmed.split("\n").map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                {renderInline(line)}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

export { VertlyMarkdown }
