import { CheckCircle2 } from "lucide-react"

type FeatureListProps = {
  items: string[]
}

function FeatureList({ items }: FeatureListProps) {
  return (
    <ul className="auth-doc-feature-list">
      {items.map((item) => (
        <li key={item} className="auth-doc-feature-list__item">
          <CheckCircle2 className="auth-doc-feature-list__icon size-3.5" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export { FeatureList }
