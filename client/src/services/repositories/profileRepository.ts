import type { SignupInput, UserProfile } from "@/types/auth"
import * as authRepository from "@/services/repositories/authRepository"
import { formatPersonName } from "@/features/profile/utils/profileName"

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const users = await authRepository.listStoredUsers()
  const user = users.find((entry) => entry.userId === userId)
  if (!user) return null

  const named = formatPersonName(user.firstName, user.lastName)

  return {
    userId: user.userId,
    firstName: named.firstName,
    lastName: named.lastName,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.createdAt,
  }
}

export async function createProfile(input: SignupInput, userId: string): Promise<UserProfile> {
  const now = new Date().toISOString()
  const named = formatPersonName(input.firstName, input.lastName)
  const profile: UserProfile = {
    userId,
    firstName: named.firstName,
    lastName: named.lastName,
    email: input.email.trim().toLowerCase(),
    createdAt: now,
    updatedAt: now,
  }

  return profile
}

export async function upsertProfile(profile: UserProfile): Promise<UserProfile> {
  const named = formatPersonName(profile.firstName, profile.lastName)
  return {
    ...profile,
    firstName: named.firstName,
    lastName: named.lastName,
  }
}
