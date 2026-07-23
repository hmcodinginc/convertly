import { getSupabaseClient } from "@/services/auth/supabaseClient"

export type ProfileExtras = {
  birthdate: string | null
  country: string | null
  avatarUrl: string | null
}

const AVATAR_BUCKET = "avatars"
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeBirthdate(value: string | null | undefined): string | null {
  const normalized = normalizeOptionalText(value)
  if (!normalized) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error("Birthday must use YYYY-MM-DD format.")
  }
  const parsed = Date.parse(`${normalized}T00:00:00Z`)
  if (Number.isNaN(parsed)) {
    throw new Error("Birthday is not a valid date.")
  }
  if (parsed > Date.now()) {
    throw new Error("Birthday cannot be in the future.")
  }
  return normalized
}

function normalizeCountry(value: string | null | undefined): string | null {
  const normalized = normalizeOptionalText(value)
  if (!normalized) return null
  return normalized.toUpperCase()
}

export async function fetchProfileExtras(userId: string): Promise<ProfileExtras | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("birthdate, country, avatar_url")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) return null

  return {
    birthdate: data.birthdate ?? null,
    country: data.country ?? null,
    avatarUrl: data.avatar_url ?? null,
  }
}

export async function uploadAvatarBlob(userId: string, blob: Blob): Promise<string> {
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error("Avatar must be under 2 MB.")
  }

  const supabase = getSupabaseClient()
  const path = `${userId}/avatar.jpg`

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, blob, {
    upsert: true,
    contentType: "image/jpeg",
    cacheControl: "3600",
  })

  if (error) {
    throw new Error(error.message || "Unable to upload avatar.")
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}

export async function deleteAvatarObject(userId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const path = `${userId}/avatar.jpg`
  await supabase.storage.from(AVATAR_BUCKET).remove([path])
}

export async function updateProfileRow(
  userId: string,
  input: {
    firstName: string
    lastName: string
    birthdate?: string | null
    country?: string | null
    avatarUrl?: string | null
  }
): Promise<void> {
  const supabase = getSupabaseClient()

  const payload: {
    first_name: string
    last_name: string
    birthdate?: string | null
    country?: string | null
    avatar_url?: string | null
  } = {
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
  }

  if (input.birthdate !== undefined) {
    payload.birthdate = normalizeBirthdate(input.birthdate)
  }
  if (input.country !== undefined) {
    payload.country = normalizeCountry(input.country)
  }
  if (input.avatarUrl !== undefined) {
    payload.avatar_url = normalizeOptionalText(input.avatarUrl)
  }

  const { error } = await supabase.from("profiles").update(payload).eq("id", userId)

  if (error) {
    throw new Error(error.message || "Unable to update profile.")
  }
}
