import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"

type AuthSlideFrameProps = {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}

function AuthSlideFrame({ eyebrow, title, description, children }: AuthSlideFrameProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0 space-y-2">
        <Text
          size="sm"
          className="max-w-none text-xs font-medium tracking-[0.16em] uppercase text-foreground/58"
        >
          {eyebrow}
        </Text>
        <Heading level={2} size="section" className="max-w-[18ch] text-balance leading-tight">
          {title}
        </Heading>
        <Text variant="muted" size="sm" className="max-w-[38ch] leading-6 text-foreground/62">
          {description}
        </Text>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}

export { AuthSlideFrame }
