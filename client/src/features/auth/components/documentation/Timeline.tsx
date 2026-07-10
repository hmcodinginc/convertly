type TimelineItem = {
  id: string
  phase: string
  title: string
  description: string
}

type TimelineProps = {
  items: TimelineItem[]
}

function Timeline({ items }: TimelineProps) {
  return (
    <ol className="auth-doc-timeline">
      {items.map((item, index) => (
        <li key={item.id} className="auth-doc-timeline__item">
          <div className="auth-doc-timeline__rail" aria-hidden>
            <span className="auth-doc-timeline__dot" />
            {index < items.length - 1 ? <span className="auth-doc-timeline__line" /> : null}
          </div>
          <div>
            <p className="auth-doc-timeline__label">{item.phase}</p>
            <p className="auth-doc-timeline__title">{item.title}</p>
            <p className="auth-doc-timeline__body">{item.description}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export { Timeline }
export type { TimelineItem }
