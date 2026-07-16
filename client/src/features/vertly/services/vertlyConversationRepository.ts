import { getSupabaseClient } from "@/services/auth/supabaseClient"
import type { VertlyMessage, VertlySuggestion } from "@/features/vertly/types"
import type { Json } from "@/types/database"

type StoredVertlyMessage = {
  id: string
  role: VertlyMessage["role"]
  content: string
  createdAt: number
  suggestions?: VertlySuggestion[]
}

function isSuggestionArray(value: unknown): value is VertlySuggestion[] {
  return Array.isArray(value) && value.every((item) => {
    if (!item || typeof item !== "object") return false
    const candidate = item as Record<string, unknown>
    return typeof candidate.id === "string" && typeof candidate.label === "string"
  })
}

function isStoredMessage(value: unknown): value is StoredVertlyMessage {
  if (!value || typeof value !== "object") return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === "string" &&
    (candidate.role === "user" || candidate.role === "assistant" || candidate.role === "system") &&
    typeof candidate.content === "string" &&
    typeof candidate.createdAt === "number" &&
    (candidate.suggestions === undefined || isSuggestionArray(candidate.suggestions))
  )
}

function normalizeMessages(value: Json | null | undefined): VertlyMessage[] {
  if (!Array.isArray(value)) return []
  return value.filter(isStoredMessage).slice(-40)
}

export async function readVertlyConversation(userId: string): Promise<VertlyMessage[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("vertly_conversations")
    .select("messages")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return normalizeMessages(data?.messages)
}

export async function writeVertlyConversation(
  userId: string,
  messages: VertlyMessage[]
): Promise<void> {
  const supabase = getSupabaseClient()
  const payload = messages.slice(-40)
  const { error } = await supabase.from("vertly_conversations").upsert(
    {
      user_id: userId,
      messages: payload as Json,
    },
    { onConflict: "user_id" }
  )

  if (error) throw new Error(error.message)
}
