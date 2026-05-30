import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { useAuthPanel } from "@/components/auth/AuthPanelContext"
import { legalContent, type AuthLegalView } from "@/features/auth/content/authContent"

type AuthLegalPanelProps = {
  view: AuthLegalView
}

function AuthLegalPanel({ view }: AuthLegalPanelProps) {
  const { closeLegal } = useAuthPanel()
  const content = legalContent[view]

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-5 flex items-start justify-between gap-4">
        <Heading level={2} size="section" className="max-w-none">
          {content.title}
        </Heading>
        <Button variant="outline" size="sm" type="button" onClick={closeLegal}>
          Back to product
        </Button>
      </div>

      <div className="auth-legal-scroll min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-5">
          {content.sections.map((section) => (
            <div key={section.heading} className="space-y-2">
              <Text size="sm" className="max-w-none font-medium text-foreground/88">
                {section.heading}
              </Text>
              <Text variant="muted" size="sm" className="max-w-none leading-6">
                {section.body}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export { AuthLegalPanel }
