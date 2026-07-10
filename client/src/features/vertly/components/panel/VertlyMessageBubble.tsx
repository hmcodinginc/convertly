import type { VertlyMessage } from "@/features/vertly/types"
import { VertlyMarkdown } from "@/features/vertly/utils/simpleMarkdown"
import { cn } from "@/lib/utils"

function VertlyMessageBubble({ message }: { message: VertlyMessage }) {
  const isAssistant = message.role === "assistant" || message.role === "system"

  if (!message.content.trim()) return null

  return (
    <div
      className={cn(
        "vertly-message",
        isAssistant ? "vertly-message--assistant" : "vertly-message--user"
      )}
    >
      {isAssistant ? (
        <VertlyMarkdown content={message.content} />
      ) : (
        <p>{message.content}</p>
      )}
    </div>
  )
}

export { VertlyMessageBubble }
