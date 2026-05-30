import type { SignupInput, UserProfile } from "@/types/auth"
import * as authRepository from "@/services/repositories/authRepository"

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const users = await authRepository.listStoredUsers()
  const user = users.find((entry) => entry.userId === userId)
  if (!user) return null

  return {
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.createdAt,
  }
}

export async function createProfile(input: SignupInput, userId: string): Promise<UserProfile> {
  const now = new Date().toISOString()
  const profile: UserProfile = {
    userId,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim().toLowerCase(),
    createdAt: now,
    updatedAt: now,
  }

  return profile
}

export async function upsertProfile(profile: UserProfile): Promise<UserProfile> {
  return profile
}
